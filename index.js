const fetch = require('node-fetch');
const path = require('path');
const express = require('express');

const app = express();
const PORT = 2537;
const POKEMON_PER_PAGE = 10;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Functions

// Function to get Pokémon ID by name from the PokeAPI
async function getPokemonId(name) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    if (!response.ok) {
      throw new Error('Pokemon not found');
    }
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error(`Error fetching Pokémon ID for ${name}:`, error);
    // Default to 1 if there's an error or Pokémon not found
    return 1;
  }
}

// Function to fetch all Pokémon types from the PokeAPI
async function getAllPokemonTypes() {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/type');
    const data = await response.json();
    return data.results.map(type => type.name);
  } catch (error) {
    console.error('Error fetching Pokémon types:', error);
    return [];
  }
}

// Function to fetch all Pokémon names from the PokeAPI
async function getAllPokemonNames(offset = 0, limit = POKEMON_PER_PAGE) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
    const data = await response.json();
    return data.results.map(pokemon => pokemon.name);
  } catch (error) {
    console.error('Error fetching Pokémon names:', error);
    return [];
  }
}

// Function to fetch Pokémon names by type from the PokeAPI
async function getPokemonNamesByType(type) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
    const data = await response.json();
    return data.pokemon.map(entry => entry.pokemon.name);
  } catch (error) {
    console.error(`Error fetching Pokémon of type ${type}:`, error);
    return [];
  }
}

// Route to render the index page with checkboxes and pagination
app.get('/', async (req, res) => {
  try {
    const types = await getAllPokemonTypes();
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * POKEMON_PER_PAGE;
    const pokemonList = await getAllPokemonNames(offset);

    // Fetch Pokémon IDs for all fetched names
    const pokemonData = await Promise.all(pokemonList.map(async pokemon => {
      const id = await getPokemonId(pokemon);
      return { name: pokemon, id: id };
    }));

    // Calculate total pages (assuming we have a known total number of Pokémon)
    const totalPokemon = 3002; // This should be dynamically fetched if possible
    const totalPages = Math.ceil(totalPokemon / POKEMON_PER_PAGE);

    // Render the index.ejs template with the pokemonData array, types, and pagination info
    res.render('index', {
      types,
      selectedTypes: [],
      pokemonData,
      currentPage: page,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    });
  } catch (error) {
    console.error('Error rendering index page:', error);
    res.status(500).send('Error rendering index page');
  }
});

// Route to handle requests for Pokémon by types with pagination
app.get('/pokemon/:type1/:type2?', async (req, res) => {
  const type1 = req.params.type1;
  const type2 = req.params.type2;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * POKEMON_PER_PAGE;
  const types = await getAllPokemonTypes();

  try {
    if (type1 && type2) {
      const pokemonNamesType1 = await getPokemonNamesByType(type1);
      const pokemonNamesType2 = await getPokemonNamesByType(type2);

      const pokemonNames = pokemonNamesType1.filter(name => pokemonNamesType2.includes(name));

      const paginatedPokemonNames = pokemonNames.slice(offset, offset + POKEMON_PER_PAGE);

      const pokemonData = await Promise.all(paginatedPokemonNames.map(async pokemon => {
        const id = await getPokemonId(pokemon);
        return { name: pokemon, id: id };
      }));

      const totalPages = Math.ceil(pokemonNames.length / POKEMON_PER_PAGE);

      res.render('index', {
        types,
        pokemonData,
        type1,
        type2,
        currentPage: page,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        selectedTypes: [type1, type2]
      });
    } else {
      const pokemonNames = await getPokemonNamesByType(type1);

      const paginatedPokemonNames = pokemonNames.slice(offset, offset + POKEMON_PER_PAGE);

      const pokemonData = await Promise.all(paginatedPokemonNames.map(async pokemon => {
        const id = await getPokemonId(pokemon);
        return { name: pokemon, id: id };
      }));

      const totalPages = Math.ceil(pokemonNames.length / POKEMON_PER_PAGE);

      res.render('index', {
        types,
        pokemonData,
        type1,
        currentPage: page,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        selectedTypes: [type1]
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Error fetching Pokémon data');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
