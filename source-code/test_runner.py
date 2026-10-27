#!/usr/bin/env python3
"""
Automated Test Runner for SOISForge Pro
Verifies 12-octet SOIS headers, SMAS read/write operations, 32-bit address alignment, CRC-16 X.25, and 10-point normative auditor.
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sois_cli import execute_smas, audit_sois, crc16_x25

class TestSOISForge(unittest.TestCase):

    def test_01_smas_read_header_structure(self):
        res = execute_smas(addr=0x10, offset=0x0004, op="READ", tx_id=1)
        self.assertEqual(res["serviceCode"], 1)
        self.assertEqual(res["operation"], "READ")
        self.assertEqual(res["busAddress"], "0x10")
        self.assertEqual(res["memoryOffset"], "0x0004")
        # 12 header + 0 payload + 2 CRC = 14 bytes
        self.assertEqual(res["totalLength"], 14)

    def test_02_smas_write_payload_length(self):
        res = execute_smas(addr=0x20, offset=0x0008, op="WRITE", val=100)
        self.assertEqual(res["serviceCode"], 1)
        self.assertEqual(res["operation"], "WRITE")
        # 12 header + 4 payload + 2 CRC = 18 bytes
        self.assertEqual(res["totalLength"], 18)

    def test_03_crc16_integrity(self):
        res = execute_smas(addr=0x15, offset=0x0010)
        raw = bytes.fromhex(res["hex"])
        body = raw[:-2]
        c = crc16_x25(body)
        self.assertEqual(res["crcHex"], f"{c:04X}")

    def test_04_transaction_id_preservation(self):
        res = execute_smas(tx_id=42)
        self.assertEqual(res["transactionId"], 42)
        raw = bytes.fromhex(res["hex"])
        self.assertEqual((raw[3] << 8) | raw[4], 42)

    def test_05_32bit_offset_bounds(self):
        res = execute_smas(offset=0x12345678)
        self.assertEqual(res["memoryOffset"], "0x12345678")

    def test_06_device_addressing_range(self):
        res = execute_smas(addr=0xFFFF)
        self.assertEqual(res["busAddress"], "0xFFFF")

    def test_07_normative_auditor_compliance(self):
        report = audit_sois()
        self.assertEqual(report["status"], "PASSED")
        self.assertEqual(report["score"], "10/10 Normative Rules Compliant")
        self.assertEqual(len(report["rules"]), 10)

    def test_08_operation_code_differentiation(self):
        r_read = execute_smas(op="READ")
        r_write = execute_smas(op="WRITE")
        raw_r = bytes.fromhex(r_read["hex"])
        raw_w = bytes.fromhex(r_write["hex"])
        self.assertEqual(raw_r[5], 1) # Op 1 = READ
        self.assertEqual(raw_w[5], 2) # Op 2 = WRITE

    def test_09_service_code_smas(self):
        res = execute_smas()
        raw = bytes.fromhex(res["hex"])
        self.assertEqual(raw[0], 1) # Service 1

    def test_10_zero_offset_boundary(self):
        res = execute_smas(offset=0x0000)
        self.assertEqual(res["memoryOffset"], "0x0000")

if __name__ == "__main__":
    unittest.main()
