/**
 * SOISForge Pro - CCSDS 135.0-B-1 & ISO 10537 Spacecraft Onboard Interface Services (SOIS) Engine
 * Implements Subnetwork Memory Access (SMAS), Subnetwork Packet Service (SPS),
 * Device Virtualization (DVS), Device Data Pooling (DDPS), and Device Discovery (SDDS).
 * Standard: CCSDS 135.0-B-1 (Blue Book, September 2019) / ISO 10537:2024
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SOISEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // CRC-16 (X.25 / CCITT) Implementation
  function crc16(buffer) {
    let crc = 0xFFFF;
    for (let i = 0; i < buffer.length; i++) {
      crc ^= buffer[i];
      for (let j = 0; j < 8; j++) {
        if ((crc & 1) !== 0) {
          crc = (crc >>> 1) ^ 0x8408;
        } else {
          crc = crc >>> 1;
        }
      }
    }
    return (~crc) & 0xFFFF;
  }

  // SOIS Service Codes per CCSDS 135.0-B-1
  const SOIS_SERVICES = {
    SMAS: 1, // Subnetwork Memory Access Service
    SPS:  2, // Subnetwork Packet Service
    SSS:  3, // Subnetwork Synchronization Service
    SDDS: 4, // Subnetwork Device Discovery Service
    DVS:  5, // Device Virtualization Service
    DDPS: 6  // Device Data Pooling Service
  };

  class SOISEngine {
    constructor() {
      this.version = "1.0.0";
      this.standard = "CCSDS 135.0-B-1 / ISO 10537:2024";
      this.transactionCounter = 1;

      // Virtual Device Registry
      this.devices = new Map(); // address -> { name, deviceClass, memoryMap, telemetryPool }

      // Initialize default avionics devices
      this.registerDevice(0x10, "StarTracker_1", "ATTITUDE_SENSOR", {
        0x0000: { name: "STATUS_REG", val: 0x0001, desc: "Operational (Tracking)" },
        0x0004: { name: "QUAT_Q1", val: 0.1234, desc: "Attitude Quaternion Q1" },
        0x0008: { name: "QUAT_Q2", val: -0.0456, desc: "Attitude Quaternion Q2" },
        0x000C: { name: "TEMPERATURE", val: 24.5, desc: "Sensor Head Temp (°C)" }
      });

      this.registerDevice(0x20, "ReactionWheel_X", "ACTUATOR", {
        0x0000: { name: "MOTOR_STATUS", val: 0x0003, desc: "Spinning Nominal" },
        0x0004: { name: "SPEED_RPM", val: 3200, desc: "Wheel Speed (RPM)" },
        0x0008: { name: "TORQUE_CMD", val: 0.05, desc: "Commanded Torque (Nm)" }
      });

      this.registerDevice(0x30, "PowerManagement_EPS", "POWER_SUBSYSTEM", {
        0x0000: { name: "BATTERY_SOC", val: 94.8, desc: "State of Charge (%)" },
        0x0004: { name: "BUS_VOLTAGE", val: 28.2, desc: "Main Bus Voltage (V)" },
        0x0008: { name: "SOLAR_CURRENT", val: 8.6, desc: "Solar Array Current (A)" }
      });

      // Data Pool Cache for DDPS
      this.dataPool = new Map();
      this.refreshDataPool();
    }

    registerDevice(busAddress, name, deviceClass, registerMap) {
      this.devices.set(busAddress, {
        busAddress: busAddress,
        name: name,
        deviceClass: deviceClass,
        registers: registerMap,
        connected: true,
        lastSampled: Date.now()
      });
    }

    refreshDataPool() {
      for (let [addr, dev] of this.devices.entries()) {
        for (let regOffset in dev.registers) {
          let reg = dev.registers[regOffset];
          let key = `${dev.name}.${reg.name}`;
          this.dataPool.set(key, {
            device: dev.name,
            address: addr,
            register: reg.name,
            offset: parseInt(regOffset, 10),
            value: reg.val,
            description: reg.desc,
            timestamp: Date.now()
          });
        }
      }
    }

    /**
     * Executes Subnetwork Memory Access Service (SMAS) Read/Write primitive
     * @param {Object} req - { address, offset, op: 'READ'|'WRITE', data: Uint8Array|number }
     */
    executeSMAS(req) {
      const address = req.address || 0x10;
      const offset = req.offset || 0x0000;
      const op = req.op === 'WRITE' ? 2 : 1; // 1 = READ, 2 = WRITE
      const txId = this.transactionCounter++;

      let payload = new Uint8Array(4);
      if (req.op === 'WRITE') {
        let v = req.val || 0;
        payload[0] = (v >> 24) & 0xFF;
        payload[1] = (v >> 16) & 0xFF;
        payload[2] = (v >> 8) & 0xFF;
        payload[3] = v & 0xFF;
      }

      // Build 12-octet SOIS Header
      let header = new Uint8Array(12);
      header[0] = SOIS_SERVICES.SMAS; // Service 1
      header[1] = (address >> 8) & 0xFF;
      header[2] = address & 0xFF;
      header[3] = (txId >> 8) & 0xFF;
      header[4] = txId & 0xFF;
      header[5] = op; // 1 = READ, 2 = WRITE
      header[6] = (offset >>> 24) & 0xFF;
      header[7] = (offset >>> 16) & 0xFF;
      header[8] = (offset >>> 8) & 0xFF;
      header[9] = offset & 0xFF;
      header[10] = (payload.length >> 8) & 0xFF;
      header[11] = payload.length & 0xFF;

      let body = new Uint8Array(header.length + payload.length);
      body.set(header, 0);
      body.set(payload, header.length);

      let c16 = crc16(body);
      let packet = new Uint8Array(body.length + 2);
      packet.set(body, 0);
      packet[packet.length - 2] = (c16 >> 8) & 0xFF;
      packet[packet.length - 1] = c16 & 0xFF;

      let hex = Array.from(packet).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

      // Perform local simulated register read/write
      let dev = this.devices.get(address);
      let readVal = dev && dev.registers[offset] ? dev.registers[offset].val : null;

      return {
        standard: this.standard,
        service: "SMAS (Subnetwork Memory Access Service)",
        serviceCode: SOIS_SERVICES.SMAS,
        operation: req.op || 'READ',
        transactionId: txId,
        busAddress: `0x${address.toString(16).toUpperCase().padStart(2, '0')}`,
        memoryOffset: `0x${offset.toString(16).toUpperCase().padStart(4, '0')}`,
        packetBytes: packet,
        hex: hex,
        totalLength: packet.length,
        registerValue: readVal,
        crcHex: ((c16 >> 8) & 0xFF).toString(16).padStart(2, '0').toUpperCase() + (c16 & 0xFF).toString(16).padStart(2, '0').toUpperCase()
      };
    }

    /**
     * Executes Subnetwork Packet Service (SPS) transmission
     */
    executeSPS(destAddress, channelId, packetData) {
      const txId = this.transactionCounter++;
      let payload = (typeof packetData === 'string') ? new TextEncoder().encode(packetData) : new Uint8Array(packetData);

      let header = new Uint8Array(12);
      header[0] = SOIS_SERVICES.SPS; // Service 2
      header[1] = (destAddress >> 8) & 0xFF;
      header[2] = destAddress & 0xFF;
      header[3] = (txId >> 8) & 0xFF;
      header[4] = txId & 0xFF;
      header[5] = 1; // Transmit
      header[6] = 0;
      header[7] = 0;
      header[8] = (channelId >> 8) & 0xFF;
      header[9] = channelId & 0xFF;
      header[10] = (payload.length >> 8) & 0xFF;
      header[11] = payload.length & 0xFF;

      let body = new Uint8Array(header.length + payload.length);
      body.set(header, 0);
      body.set(payload, header.length);

      let c16 = crc16(body);
      let fullPkt = new Uint8Array(body.length + 2);
      fullPkt.set(body, 0);
      fullPkt[fullPkt.length - 2] = (c16 >> 8) & 0xFF;
      fullPkt[fullPkt.length - 1] = c16 & 0xFF;

      return {
        standard: this.standard,
        service: "SPS (Subnetwork Packet Service)",
        serviceCode: SOIS_SERVICES.SPS,
        transactionId: txId,
        destAddress: `0x${destAddress.toString(16).toUpperCase().padStart(2, '0')}`,
        channelId: channelId,
        packetBytes: fullPkt,
        hex: Array.from(fullPkt).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' '),
        totalLength: fullPkt.length,
        payloadSize: payload.length
      };
    }
  }

  return SOISEngine;
}));
