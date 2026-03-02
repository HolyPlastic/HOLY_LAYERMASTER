(function(thisObj) {
    function buildUI(thisObj) {
        // Check if the script is running in a dockable panel or as a standalone window
        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Rename Selected Layers", undefined, {resizeable: true});
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 10;
        win.margins = 16;

        // --- UI Setup ---
        
        // Search Group
        var searchGroup = win.add("group");
        searchGroup.orientation = "row";
        searchGroup.alignChildren = ["left", "center"];
        searchGroup.add("statictext", undefined, "Search:");
        var searchInput = searchGroup.add("edittext", undefined, "");
        searchInput.characters = 15;
        searchInput.alignment = ["fill", "center"];

        // Replace Group
        var replaceGroup = win.add("group");
        replaceGroup.orientation = "row";
        replaceGroup.alignChildren = ["left", "center"];
        replaceGroup.add("statictext", undefined, "Replace:");
        var replaceInput = replaceGroup.add("edittext", undefined, "");
        replaceInput.characters = 15;
        replaceInput.alignment = ["fill", "center"];

        // Apply Button
        var applyBtn = win.add("button", undefined, "Apply");

        // --- Action Logic ---
        applyBtn.onClick = function() {
            // Check if there is an active item in the project
            var comp = app.project.activeItem;

            // Make sure the active item is actually a Composition
            if (comp && comp instanceof CompItem) {
                var selectedLayers = comp.selectedLayers;

                // Check if any layers are selected
                if (selectedLayers.length > 0) {
                    
                    // Group the actions so you can undo them with a single Ctrl/Cmd+Z
                    app.beginUndoGroup("Search and Replace Layer Names"); 

                    var searchStr = searchInput.text;
                    var replaceStr = replaceInput.text;

                    // Loop through all selected layers
                    for (var i = 0; i < selectedLayers.length; i++) {
                        var currentName = selectedLayers[i].name;

                        if (searchStr === "") {
                            // If search field is empty, act as a prefix like the original script
                            selectedLayers[i].name = replaceStr + currentName;
                        } else {
                            // Global search and replace by splitting and joining
                            selectedLayers[i].name = currentName.split(searchStr).join(replaceStr);
                        }
                    }

                    app.endUndoGroup();
                    
                } else {
                    alert("Please select at least one layer in the timeline.");
                }
            } else {
                alert("Please open a composition and select the layers you want to rename.");
            }
        };

        // Ensure the panel resizes properly when docked
        win.onResizing = win.onResize = function() {
            this.layout.resize();
        };

        return win;
    }

    // Instantiate and show the panel
    var myPanel = buildUI(thisObj);
    if (myPanel instanceof Window) {
        myPanel.center();
        myPanel.show();
    } else {
        myPanel.layout.layout(true);
        myPanel.layout.resize();
    }

})(this);