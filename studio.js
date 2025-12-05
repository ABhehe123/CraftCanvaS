let filerobotEditor = null;
let currentFilePath = null; 
let lastDesignState = null; 
// Ensure we point to the local placeholder we discussed
let currentImageSource = 'assets/placeholder.png'; 
let hasUnsavedChanges = false;

window.terminateStudio = function() {
    if (filerobotEditor) {
        try {
            filerobotEditor.terminate();
        } catch(e) { console.log("Editor terminate warning:", e); }
        filerobotEditor = null;
    }
    const container = document.getElementById('studio-workspace-container');
    if(container) container.innerHTML = ""; 
};

window.initStudio = function() {
    const container = document.getElementById('studio-workspace-container');
    if (!container) return;
    
    // Clean up old instance
    if (filerobotEditor) window.terminateStudio();

    const config = {
        source: currentImageSource,
        onSave: async (editedImageObject, designState) => {
            console.log('✅ Image Saved internally.');
            lastDesignState = designState;
            hasUnsavedChanges = true; 

            const base64 = editedImageObject.imageBase64;
            const fullName = editedImageObject.fullName || 'image.png';
            const extension = fullName.split('.').pop() || 'png';

            if(base64 && window.electronAPI) {
                const res = await window.electronAPI.exportImage(base64, extension);
                if(res.success) {
                    alert(`Image exported successfully to: ${res.path}`);
                    hasUnsavedChanges = false; 
                }
            }
        },
        onModify: () => { hasUnsavedChanges = true; },
        // Full feature set
        tabsIds: ['Adjust', 'Annotate', 'Filters', 'Finetune', 'Resize'],
        defaultTabId: 'Annotate',
        defaultToolId: 'Text',
        useBackendTranslations: false,
        showInModal: false,
        useCloudimage: false, 
        theme: {
            colors: {
                primaryBg: '#1e1e1e',
                secondaryBg: '#121212',
            }
        }
    };

    if (typeof FilerobotImageEditor !== 'undefined') {
        filerobotEditor = new FilerobotImageEditor(container, config);
        filerobotEditor.render();
        
        // FIX: Force resize event so editor knows its size
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 300);
        
    } else {
        container.innerHTML = "<h2 style='color:white;text-align:center;margin-top:20px'>Error: Editor Failed to Load. Check Internet.</h2>";
    }
};

window.addImageToEditor = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return; 
        
        const url = URL.createObjectURL(file);
        currentImageSource = url; 
        
        // Always re-init to ensure clean state with new image
        window.initStudio();
        
        currentFilePath = null;
        hasUnsavedChanges = false;
        lastDesignState = null; 
    };
    input.click();
};

window.saveProjectFile = async () => {
    if(!lastDesignState && !currentImageSource) {
        alert("No image loaded to save.");
        return;
    }

    const projectData = {
        imgSrc: currentImageSource,
        state: lastDesignState || {} 
    };

    const content = JSON.stringify(projectData);

    if (window.electronAPI) {
        const res = await window.electronAPI.saveProject(content, currentFilePath);
        if (res.success) {
            currentFilePath = res.path;
            hasUnsavedChanges = false;
            alert("Project (.cavs) saved successfully!");
        }
    }
};

window.openProjectFile = async () => {
    if (window.electronAPI) {
        const res = await window.electronAPI.openProject();
        if (res.success) {
            try {
                const projectData = JSON.parse(res.content);
                if(projectData.imgSrc) {
                    currentImageSource = projectData.imgSrc;
                    lastDesignState = projectData.state;
                    
                    // Re-init editor with loaded data
                    window.initStudio();
                    
                    // Allow editor to render then apply state
                    setTimeout(() => {
                         if(filerobotEditor) {
                             filerobotEditor.render({
                                source: currentImageSource,
                                ...lastDesignState 
                             });
                         }
                    }, 500);

                    currentFilePath = res.path;
                    hasUnsavedChanges = false;
                    console.log("Project loaded.");
                } else {
                    alert("Invalid project file.");
                }
            } catch (e) {
                console.error(e);
                alert("Corrupt project file.");
            }
        }
    }
};

if(window.electronAPI && window.electronAPI.onCheckUnsaved) {
    window.electronAPI.onCheckUnsaved(() => {
        if(hasUnsavedChanges) {
            const choice = confirm("You have unsaved changes in Studio. Exit anyway?");
            if(choice) window.electronAPI.confirmClose();
        } else {
            window.electronAPI.confirmClose();
        }
    });
}