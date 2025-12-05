const axios = require('axios');
const API_URL = "https://api.modrinth.com/v2";

async function searchMods(query, version, loader, offset = 0, type = 'mod') {
    try {
        const limit = 20;
        
        // Base facet: Project Type (mod, resourcepack, shader)
        const facets = [[`project_type:${type}`]];
        
        // Version filter (Common to all)
        if (version && version !== 'any') {
            facets.push([`versions:${version}`]);
        }
        
        // Loader filter: ONLY apply to Mods.
        // Resource Packs/Shaders on Modrinth don't strictly use loader categories in search facets consistently.
        if (type === 'mod' && loader && loader !== 'any') {
            facets.push([`categories:${loader}`]);
        }

        const facetString = JSON.stringify(facets);
        const url = `${API_URL}/search?query=${query}&facets=${facetString}&limit=${limit}&offset=${offset}`;
        
        console.log(`Searching: ${url}`); // Debug log in terminal
        const response = await axios.get(url);
        
        return response.data.hits || [];
    } catch (error) {
        console.error("Modrinth Search Error:", error.message);
        return [];
    }
}

async function getModDetails(id) { 
    try { 
        return (await axios.get(`${API_URL}/project/${id}`)).data; 
    } catch(e){ return null; } 
}

async function getModVersions(id) { 
    try { 
        return (await axios.get(`${API_URL}/project/${id}/version`)).data; 
    } catch(e){ return []; } 
}

async function getAllGameVersions() {
    try {
        const response = await axios.get(`${API_URL}/tag/game_version`);
        // Filter only release versions to keep list clean
        return response.data.filter(v => v.version_type === 'release').map(v => v.version);
    } catch (e) { return []; }
}

async function getAllLoaders() {
    try {
        const response = await axios.get(`${API_URL}/tag/loader`);
        return response.data.map(l => l.name);
    } catch (e) { return []; }
}

module.exports = { searchMods, getModDetails, getModVersions, getAllGameVersions, getAllLoaders };