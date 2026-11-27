import importlib.util
import pathlib
import shutil
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location("audit_loader",pathlib.Path("native/audit-loader.py"))
audit=importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class AuditTests(unittest.TestCase):
    def test_ifunc(self):
        rows=list(audit.symbols("""
  123: 0001abcd  16 <OS specific>: 10 GLOBAL DEFAULT 13 memcpy@@GLIBC_2.4
  124: 00000000   0 FUNC GLOBAL DEFAULT UND pthread_create@GLIBC_2.4 (2)
  125: 00001000   8 IFUNC WEAK PROTECTED 13 test@@VER
"""))
        self.assertEqual([r[1] for r in rows],["IFUNC","FUNC","IFUNC"])
        self.assertEqual(rows[1][-1],"2")
    def test_explicit_path(self):
        with patch.object(shutil,"which",return_value="C:/msys64/ucrt64/bin/readelf.exe"):
            self.assertEqual(audit.resolve_readelf("readelf.exe"),"C:/msys64/ucrt64/bin/readelf.exe")
    def test_missing_tool(self):
        with patch.object(shutil,"which",return_value=None):
            with self.assertRaisesRegex(SystemExit,"--readelf"):
                audit.resolve_readelf("not-a-real-readelf.exe")
    def test_overlap(self):
        meta={"type":"FUNC","binding":"GLOBAL","visibility":"DEFAULT","name":"g_malloc"}
        hook={"soname":"libinputhookpp.so","exports":{"g_malloc":"1"},"export_info":{"g_malloc":meta},"relocations":[{"symbol":"g_malloc","type":"R_ARM_JUMP_SLOT","offset":"1"}]}
        other={"soname":"libglib-2.0.so.0","exports":{"g_malloc":"2"},"export_info":{"g_malloc":meta}}
        result=audit.overlaps([hook,other],{hook["soname"]:hook})
        self.assertEqual(result[0]["with_hook_relocations"],1)
        self.assertEqual(result[0]["count"],1)

if __name__=="__main__": unittest.main()
