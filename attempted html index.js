const fetch = require('node-fetch');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 2537; // Use environment port or default to 2537
const POKEMON_PER_PAGE = 10;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse incoming JSON requests
app.use(express.json());

// Middleware to parse incoming form data
app.use(express.urlencoded({ extended: true }));



async function getPokemonNamesByType(type) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
    if (!response.ok) {
      throw new Error(`Pokémon type ${type} not found: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.pokemon.map(entry => entry.pokemon.name);
  } catch (error) {
    console.error(`Error fetching Pokémon of type ${type}:`, error);
    return [];
  }
}



// Route to serve index.html
app.get('/', async (req, res) => {
  try {
    const types = await getAllPokemonTypes();
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Error serving index.html');
  }
});

// Route to fetch all Pokémon types from PokeAPI
app.get('/types', async (req, res) => {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/type');
    if (!response.ok) {
      throw new Error('Failed to fetch Pokémon types');
    }
    const data = await response.json();
    const pokemonTypes = data.results.map(type => type.name);
    res.json(pokemonTypes);
  } catch (error) {
    console.error('Error fetching Pokémon types:', error);
    res.status(500).json({ error: 'Failed to fetch Pokémon types' });
  }
});


// Route to fetch Pokémon data based on selected types and pagination
app.get('/pokemon', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const selectedTypes = req.query.type || [];
  const offset = (page - 1) * POKEMON_PER_PAGE;

  try {
    if (selectedTypes.length === 0) {
      // Fetch all Pokémon if no types selected
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${POKEMON_PER_PAGE}`);
      const data = await response.json();
      const pokemonData = await Promise.all(data.results.map(async pokemon => {
        const id = pokemon.url.split('/').slice(-2, -1)[0];
        return { name: pokemon.name, id };
      }));
      const totalPokemon = await getTotalPokemonCount();
      const totalPages = Math.ceil(totalPokemon / POKEMON_PER_PAGE);

      res.json({
        pokemonData,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        totalPokemonCount: totalPokemon
      });
    } else if (selectedTypes.length === 1) {
      // Fetch Pokémon by single type and paginate
      const pokemonNames = await getPokemonNamesByType(selectedTypes[0]);
      const paginatedPokemonNames = pokemonNames.slice(offset, offset + POKEMON_PER_PAGE);
      const pokemonData = await Promise.all(paginatedPokemonNames.map(async name => {
        const id = await getPokemonId(name);
        return { name, id };
      }));
      const totalPokemonCount = pokemonNames.length;
      const totalPages = Math.ceil(totalPokemonCount / POKEMON_PER_PAGE);

      res.json({
        pokemonData,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        totalPokemonCount
      });
    } else {
      // Fetch Pokémon by dual types and paginate
      const type1 = selectedTypes[0];
      const type2 = selectedTypes[1];
      const pokemonNamesType1 = await getPokemonNamesByType(type1);
      const pokemonNamesType2 = await getPokemonNamesByType(type2);
      const pokemonNames = pokemonNamesType1.filter(name => pokemonNamesType2.includes(name));
      const paginatedPokemonNames = pokemonNames.slice(offset, offset + POKEMON_PER_PAGE);
      const pokemonData = await Promise.all(paginatedPokemonNames.map(async name => {
        const id = await getPokemonId(name);
        return { name, id };
      }));
      const totalPokemonCount = pokemonNames.length;
      const totalPages = Math.ceil(totalPokemonCount / POKEMON_PER_PAGE);

      res.json({
        pokemonData,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        totalPokemonCount
      });
    }
  } catch (error) {
    console.error('Error fetching Pokémon data:', error);
    res.status(500).json({ error: 'Error fetching Pokémon data' });
  }
});


// Function to fetch Pokémon ID by name from the PokeAPI
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
    return 1;
  }
}

// Function to fetch total count of Pokémon from the PokeAPI
async function getTotalPokemonCount() {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1');
    const data = await response.json();
    return data.count || 0; // Returns the total count of Pokémon
  } catch (error) {
    console.error('Error fetching total Pokémon count:', error);
    return 0;
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
