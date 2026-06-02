"""Convert the name title STEP -> raw glTF, oriented to sit on the print bed.

OCP reads Title.step (a single extruded-text solid), tessellates to one mesh.
The STEP is already authored height-along-Z (Blender up): X=width, Z=height,
Y=thickness — so no axis rotation is needed; export_yup maps Z-up -> glТF Y-up.
We just scale to a bed-friendly width, centre X/Y, and drop the bottom to Z=0 so
the title rests ON the plate. Exports blender/assets/Title.raw.glb (no Draco —
gltfjsx -T compresses next). Run via: build_ender5.sh title
"""
import bpy, sys, os
from mathutils import Vector, Matrix

sys.path.append(os.path.join(os.getcwd(), "blender", "scripts"))
import lib_ender5 as L

from OCP.STEPControl import STEPControl_Reader
from OCP.IFSelect import IFSelect_RetDone
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_FACE, TopAbs_Orientation
from OCP.BRep import BRep_Tool
from OCP.TopLoc import TopLoc_Location
from OCP.TopoDS import TopoDS

SRC = os.path.abspath("apps/client/public/assets/objects/Title.step")
OUT = os.path.abspath("blender/assets/Title.raw.glb")
TARGET_WIDTH_M = 0.18   # name spans ~0.18 m of the ~0.22 m bed (tuned in the R3F level)


def read_shape(path):
    r = STEPControl_Reader()
    if r.ReadFile(path) != IFSelect_RetDone:
        raise RuntimeError("STEP read failed: " + path)
    r.TransferRoots()
    return r.OneShape()


def to_mesh(shape):
    BRepMesh_IncrementalMesh(shape, 0.2, False, 0.4, True)
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
    me = bpy.data.meshes.new("Title")
    me.from_pydata(verts, [], faces)
    me.validate()
    me.update()
    ob = bpy.data.objects.new("Title", me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def bbox(ob):
    bb = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    mn = Vector((min(p[i] for p in bb) for i in range(3)))
    mx = Vector((max(p[i] for p in bb) for i in range(3)))
    return mn, mx


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = 'METRIC'
    ob = to_mesh(read_shape(SRC))

    mn, mx = bbox(ob)
    s = TARGET_WIDTH_M / (mx.x - mn.x)
    ob.data.transform(Matrix.Scale(s, 4))
    ob.data.update()

    mn, mx = bbox(ob)
    # centre X & Y (thickness), drop bottom (min Z = height) to 0 -> rests on plate
    ob.data.transform(Matrix.Translation((-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z)))
    ob.data.update()

    print("@@TITLE dims(W,thick,H) = %s verts=%d" % (tuple(round(x, 4) for x in ob.dimensions), len(ob.data.vertices)))
    assert len(ob.data.vertices) > 50, "title mesh empty/too small"

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format='GLB', use_selection=True,
        export_draco_mesh_compression_enable=False, export_yup=True, export_apply=True,
    )
    print("@@TITLE saved=%s bytes=%d" % (OUT, os.path.getsize(OUT)))


main()
