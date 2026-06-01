"""STEP -> named Blender meshes via OpenCASCADE (OCP) inside Blender's Python.

Reads the SolidWorks AP203 assembly, walks the XCAF product tree preserving the
PRODUCT names and per-instance placements, tessellates every leaf solid with
BRepMesh, and builds one named Blender mesh object per instance (in metres).
Saves ender5_raw.blend. Run via: blender --background --python this_file.
"""
import bpy, sys, os
from collections import defaultdict

sys.path.append(os.path.join(os.getcwd(), "blender", "scripts"))
import lib_ender5 as L

from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.XCAFApp import XCAFApp_Application
from OCP.XCAFDoc import XCAFDoc_DocumentTool, XCAFDoc_ShapeTool
from OCP.TDocStd import TDocStd_Document
from OCP.TCollection import TCollection_ExtendedString
from OCP.TDF import TDF_LabelSequence, TDF_Label
from OCP.TDataStd import TDataStd_Name
from OCP.IFSelect import IFSelect_RetDone
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.TopLoc import TopLoc_Location
from OCP.TopAbs import TopAbs_FACE, TopAbs_Orientation
from OCP.TopExp import TopExp_Explorer
from OCP.BRep import BRep_Tool
from OCP.TopoDS import TopoDS

LINEAR_DEFLECTION = 0.4    # mm — coarse-ish; printer is shown small on the web
ANGULAR_DEFLECTION = 0.5   # rad


def label_name(label):
    attr = TDataStd_Name()
    if label.FindAttribute(TDataStd_Name.GetID_s(), attr):
        return attr.Get().ToExtString()
    return "part"


def read_shape_tool(path):
    # The document MUST stay referenced for the lifetime of the returned ShapeTool:
    # its labels live in `doc`, and if `doc` is GC'd the ShapeTool sees 0 shapes.
    app = XCAFApp_Application.GetApplication_s()
    doc = TDocStd_Document(TCollection_ExtendedString("doc"))
    app.NewDocument(TCollection_ExtendedString("MDTV-XCAF"), doc)
    reader = STEPCAFControl_Reader()
    reader.SetNameMode(True)
    reader.SetColorMode(True)
    reader.SetLayerMode(True)
    if reader.ReadFile(path) != IFSelect_RetDone:
        raise RuntimeError("STEP read failed: " + path)
    if not reader.Transfer(doc):
        raise RuntimeError("STEP transfer produced no document: " + path)
    return XCAFDoc_DocumentTool.ShapeTool_s(doc.Main()), doc


def collect_leaves(shape_tool):
    """Return [(unique_name, world-located TopoDS_Shape)] for every leaf instance."""
    out = []
    seen = defaultdict(int)

    def walk(label, loc):
        if XCAFDoc_ShapeTool.IsAssembly_s(label):
            comps = TDF_LabelSequence()
            XCAFDoc_ShapeTool.GetComponents_s(label, comps)
            for i in range(1, comps.Length() + 1):
                c = comps.Value(i)
                cloc = XCAFDoc_ShapeTool.GetLocation_s(c)
                composed = loc.Multiplied(cloc)
                ref = TDF_Label()
                if XCAFDoc_ShapeTool.GetReferredShape_s(c, ref):
                    walk(ref, composed)
                else:
                    walk(c, composed)
        else:
            name = label_name(label)
            seen[name] += 1
            uniq = name if seen[name] == 1 else "%s.%03d" % (name, seen[name])
            shape = XCAFDoc_ShapeTool.GetShape_s(label).Located(loc)
            out.append((uniq, shape))

    roots = TDF_LabelSequence()
    shape_tool.GetFreeShapes(roots)
    for i in range(1, roots.Length() + 1):
        walk(roots.Value(i), TopLoc_Location())
    return out


def shape_to_object(name, shape):
    BRepMesh_IncrementalMesh(shape, LINEAR_DEFLECTION, False, ANGULAR_DEFLECTION, True)
    verts, faces = [], []
    exp = TopExp_Explorer(shape, TopAbs_FACE)
    while exp.More():
        face = TopoDS.Face_s(exp.Current())
        loc = TopLoc_Location()
        tri = BRep_Tool.Triangulation_s(face, loc)
        if tri is not None:
            trsf = loc.Transformation()
            base = len(verts)
            for k in range(1, tri.NbNodes() + 1):
                p = tri.Node(k).Transformed(trsf)
                verts.append((p.X() * L.MM_TO_M, p.Y() * L.MM_TO_M, p.Z() * L.MM_TO_M))
            rev = face.Orientation() == TopAbs_Orientation.TopAbs_REVERSED
            for k in range(1, tri.NbTriangles() + 1):
                a, b, c = tri.Triangle(k).Get()
                if rev:
                    a, c = c, a
                faces.append((base + a - 1, base + b - 1, base + c - 1))
        exp.Next()
    if not faces:
        return None
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = 'METRIC'
    st, doc = read_shape_tool(os.path.abspath(L.SRC_STEP))
    leaves = collect_leaves(st)
    assert doc is not None  # keep doc referenced until after the walk
    print("@@IMPORT leaves_found=%d" % len(leaves))
    n = 0
    for name, shape in leaves:
        if shape_to_object(name, shape):
            n += 1
    print("@@IMPORT objects=%d" % n)
    assert n > 100, "expected >100 leaf solids, got %d" % n
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(L.BLEND_RAW))
    print("@@IMPORT saved=%s" % os.path.abspath(L.BLEND_RAW))


main()
