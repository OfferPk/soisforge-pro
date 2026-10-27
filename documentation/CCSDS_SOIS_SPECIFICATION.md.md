\# CCSDS 135.0-B-1 & ISO 10537 Spacecraft Onboard Interface Services Specification

\#\# 1\. Scope & Avionics Standard Role  
The \*\*Consultative Committee for Space Data Systems (CCSDS)\*\* Recommendation \*\*CCSDS 135.0-B-1\*\* (and international standard \*\*ISO 10537:2024\*\*) defines the \*\*Spacecraft Onboard Interface Services (SOIS)\*\*.

SOIS standardizes communication across onboard satellite subnetwork buses (SpaceWire, MIL-STD-1553B, CAN, Ethernet, I2C, SPI) to eliminate proprietary device drivers, accelerate payload integration, and enable plug-and-play flight avionics in architectures such as NASA Core Flight System (cFS) and ESA SAVOIR.

\---

\#\# 2\. Layered Architecture

\#\#\# Subnetwork Layer Services  
Provides standardized access across heterogeneous physical flight buses:  
1\. \*\*Subnetwork Memory Access Service (SMAS)\*\*: Word-aligned memory read and write primitives (\`READ.request\`, \`WRITE.request\`, \`RMW.request\`) over 32-bit offset spaces.  
2\. \*\*Subnetwork Packet Service (SPS)\*\*: Unreliable and reliable raw packet transmission with Channel ID and Quality of Service (QoS) guarantees.  
3\. \*\*Subnetwork Synchronization Service (SSS)\*\*: Distributes time synchronization events and periodic clock pulses with sub-microsecond jitter tolerance.  
4\. \*\*Subnetwork Device Discovery Service (SDDS)\*\*: Detects dynamic connection and disconnection of modular instruments and sensors on plug-and-play buses.

\#\#\# Application Support Layer Services  
1\. \*\*Device Virtualization Service (DVS)\*\*: Abstracts physical sensor and actuator hardware into standard device classes (star trackers, reaction wheels, IMUs, thermistors, power regulators), decoupling flight software applications from specific chipsets.  
2\. \*\*Device Data Pooling Service (DDPS)\*\*: Provides a background sampling and caching data pool that serves fresh sensor data to flight software without bus thrashing or excessive polling.

\---

\#\# 3\. Normative Frame Structure (12-Octet Header)  
\- \`Service Code\` (1 octet: 1=SMAS, 2=SPS, 3=SSS, 4=SDDS, 5=DVS, 6=DDPS)  
\- \`Subnetwork Address\` (2 octets)  
\- \`Transaction ID\` (2 octets)  
\- \`Operation Code\` (1 octet: 1=Read, 2=Write, etc.)  
\- \`Memory Offset / Channel\` (4 octets, 32-bit address space)  
\- \`Data Length\` (2 octets)  
\- Followed by data payload and a 16-bit CRC-16 (X.25) trailer.  
