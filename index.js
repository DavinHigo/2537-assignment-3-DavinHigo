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

// Middleware to parse incoming JSON requests
app.use(express.json());

// Middleware to parse incoming form data
app.use(express.urlencoded({ extended: true }));


// Functions to fetch Pokémon data
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
    if (!response.ok) {
      throw new Error('Failed to fetch Pokémon types');
    }
    const data = await response.json();
    return data.results.map(type => type.name);
  } catch (error) {
    console.error('Error fetching Pokémon types:', error);
    return [];
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

// Function to fetch all Pokémon names from the PokeAPI
async function getAllPokemonNames(offset = 0, limit = POKEMON_PER_PAGE) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Pokémon names');
    }
    const data = await response.json();
    return data.results.map(pokemon => pokemon.name);
  } catch (error) {
    console.error('Error fetching Pokémon names:', error);
    return [];
  }
}

// Function to fetch Pokémon names by type from the PokeAPI
// Function to fetch Pokémon names by type from the PokeAPI
async function getPokemonNamesByType(type) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Pokémon types');
    }
    const data = await response.json();
    return data.pokemon.map(entry => entry.pokemon.name);
  } catch (error) {
    console.error(`Error fetching Pokémon of type ${type}:`, error);
    return [];
  }
}


// Function to get total count of Pokémon based on selected types
async function getTotalPokemonCount(selectedTypes = []) {
  try {
    if (selectedTypes.length === 0) {
      // If no types selected, fetch total count of all Pokémon
      const response = await fetch('https://pokeapi.co/api/v2/pokemon');
      const data = await response.json();
      return data.count;
    } else if (selectedTypes.length === 1) {
      // If one type selected, fetch count of Pokémon of that type
      const type = selectedTypes[0];
      const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
      const data = await response.json();
      return data.pokemon.length;
    } else {
      // If two types selected, fetch count of Pokémon matching both types
      const type1 = selectedTypes[0];
      const type2 = selectedTypes[1];

      const response1 = await fetch(`https://pokeapi.co/api/v2/type/${type1}`);
      const data1 = await response1.json();

      const response2 = await fetch(`https://pokeapi.co/api/v2/type/${type2}`);
      const data2 = await response2.json();

      // Find intersection of Pokémon between two types
      const pokemonNames1 = data1.pokemon.map(entry => entry.pokemon.name);
      const pokemonNames2 = data2.pokemon.map(entry => entry.pokemon.name);

      const intersectedPokemonNames = pokemonNames1.filter(name => pokemonNames2.includes(name));

      return intersectedPokemonNames.length;
    }
  } catch (error) {
    console.error('Error fetching total Pokémon count:', error);
    return 0; // Default to 0 if there's an error
  }
}


// Routes

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

    // Fetch total Pokémon count
    const totalPokemon = await getTotalPokemonCount();
    const totalPages = Math.ceil(totalPokemon / POKEMON_PER_PAGE);

    // Render the index.ejs template with the pokemonData array, types, and pagination info
    res.render('index', {
      types,
      selectedTypes: [],
      pokemonData,
      currentPage: page,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      totalPokemonCount: totalPokemon
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

  try {
    const types = await getAllPokemonTypes();

    if (type1 && type2) {
      const pokemonNamesType1 = await getPokemonNamesByType(type1);
      const pokemonNamesType2 = await getPokemonNamesByType(type2);

      const pokemonNames = pokemonNamesType1.filter(name => pokemonNamesType2.includes(name));
      
      const paginatedPokemonNames = pokemonNames.slice(offset, offset + POKEMON_PER_PAGE);

      const pokemonData = await Promise.all(paginatedPokemonNames.map(async pokemon => {
        const id = await getPokemonId(pokemon);
        return { name: pokemon, id: id };
      }));
      
      const totalPokemon = pokemonNames.length;
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
        selectedTypes: [type1, type2],
        totalPokemonCount: totalPokemon
      });
    } else if (type1) {
      const pokemonNames = await getPokemonNamesByType(type1);

      const paginatedPokemonNames = pokemonNames.slice(offset, offset + POKEMON_PER_PAGE);

      const pokemonData = await Promise.all(paginatedPokemonNames.map(async pokemon => {
        const id = await getPokemonId(pokemon);
        return { name: pokemon, id: id };
      }));

      const totalPokemon = pokemonNames.length;
      const totalPages = Math.ceil(pokemonNames.length / POKEMON_PER_PAGE);

      res.render('index', {
        types,
        pokemonData,
        type1,
        currentPage: page,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        selectedTypes: [type1],
        totalPokemonCount: totalPokemon
      });
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Error fetching Pokémon data');
  }
});



// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
