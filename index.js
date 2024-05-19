const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 2537;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views'); // Specify the directory for views

// Route to fetch Pokemon data with pagination and render index.ejs
app.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
    const data = await response.json();
    
    const totalCount = await getTotalPokemonCount(); // Fetch total count of Pokemon
    const totalPages = Math.ceil(totalCount / limit);

    res.render('index', { pokemonList: data.results, page, totalPages }); // Pass totalPages to index.ejs
  } catch (error) {
    console.error('Error fetching Pokemon data:', error);
    res.status(500).json({ error: 'Failed to fetch Pokemon data' });
  }
});

// Function to get total count of Pokemon
const getTotalPokemonCount = async () => {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1`);
    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error('Error fetching total Pokemon count:', error);
    return 0;
  }
};

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
