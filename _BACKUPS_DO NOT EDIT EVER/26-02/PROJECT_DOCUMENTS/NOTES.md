Summary of all changes since initial creation:



Moved Cap buttons to left of input fields, Sel buttons remain right

Added orange coloring (.cap-active) to Cap buttons when data is stored in that bank

Added bank name persistence with auto-save on keystroke input

Fixed Cap button indicators on panel load with retry logic (handles AE initialization timing)

Added dev reload button (↺ Reload) at the bottom

Refactored from static 3 banks to dynamic per-project bank configuration with +/− add/remove buttons

Switched from global localStorage names to per-project JSON config files (survives panel reloads per project)

Changed rendering from static HTML to dynamic DOM generation via renderBankRow() and renderAll()

Banks are now fully dynamic with +/− buttons to add/remove them freely, and each AE project saves its own independent bank configuration.



# After Effects Extension: Trans-Comp Persistence



\## The Core Problem



When working with script-based memory banks in After Effects, two major logic hurdles emerge regarding compositions:



1\. \*\*The Pre-comp ID Wipe:\*\* When you pre-compose layers, After Effects doesn't just move them. It copies the layers, creates a \*new\* composition, pastes the layers into it (assigning them brand new `Layer.id`s), and deletes the originals. This instantly breaks strict ID-based tracking.

2\. \*\*Context-Blindness:\*\* Global memory banks don't make sense. If you save "Main Character" layers in Comp A, pressing "Select" while inside Comp B shouldn't throw an error or search blindly—it should select whatever was banked specifically for Comp B.



\## Solutions \& Workarounds



\### 1. Hierarchical JSON Database



Instead of saving flat files (e.g., `BankA.json`), the Node.js backend writes a single master JSON file for the project, using the `Comp.id` as the parent key.



\- \*Example structure:\* `"comp\_15": { "LayA": \[45, 46] }`

\- \*\*The Benefit:\*\* "Bank A" becomes infinitely reusable and context-aware. It simply means "Bank A for my active composition."

\- \*\*The Limitation:\*\* This solves context switching but does \*not\* solve the pre-comp ID wipe.



\### 2. "DNA Tagging" (Layer Comments)



To survive a pre-comp, the script injects a hidden tag directly into the layer's "DNA," specifically the Layer Comment field (e.g., `\[MM:LayA]`). When the Select button is pressed, if the JSON ID lookup fails, the script performs a fallback scan of the active comp's layer comments to find the tag.



\- \*\*The Benefit:\*\* Survives pre-comping, copy-pasting, and duplicating because the tag travels with the layer itself.



\#### The "Jank" \& Limitations of DNA Tagging



While this is the most robust workaround allowed by the After Effects API, it comes with strict limitations:



\- \*\*Keyframe Breaking:\*\* Keyframes do not have a comment field or any taggable metadata. \*\*Keyframe memory will always break on pre-comping.\*\* Keyframe storage must remain strictly limited to the original composition.

\- \*\*The Clone Multiplier:\*\* Because the tag lives in the layer's comment, duplicating a layer (`Ctrl/Cmd+D`) also duplicates the tag. Pressing "Select" will now highlight both the original layer and its clone.

\- \*\*Cross-Contamination:\*\* If you copy a tagged layer from Comp 1 and paste it into Comp 2, it brings the tag with it. Pressing "Select" in Comp 2 will accidentally select that pasted layer.

\- \*\*User Destruction:\*\* If a user, or another organizational script, highlights all layers and clears the comment column, the memory tracking is destroyed permanently.

