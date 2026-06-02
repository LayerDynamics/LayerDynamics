import Printer from '../Printer/Printer'

/**
 * The standalone 3D Printing level — the Ender 5 rig (now in the reusable
 * `Printer`) with no printed object. (Removed once the Hero becomes the printer.)
 */
export default function PrintingLevel() {
  return <Printer />
}
