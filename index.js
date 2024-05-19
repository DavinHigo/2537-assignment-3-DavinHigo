const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 2537;

// Serve static files from the public directory
app.use(express.static('public'));

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Route to render the index page
app.get('/', async (req, res) => {
  try {
    // Fetch list of Pokemon from PokeAPI
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=3002');
    if (!response.ok) {
      throw new Error('Failed to fetch Pokemon');
    }
    const data = await response.json();
    const pokemonList = data.results;
    
    // Render the index page with the list of Pokemon
    res.render('index', { pokemonList });
  } catch (error) {
    console.error('Error fetching Pokemon:', error);
    res.status(500).send('Error fetching Pokemon');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
