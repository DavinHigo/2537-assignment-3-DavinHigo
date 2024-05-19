document.addEventListener('DOMContentLoaded', function() {
  const filterForm = document.getElementById('filterForm');
  const pokemonListElement = document.getElementById('pokemonList');
  let initialPokemonList = []; // To store initial list fetched from server

  // Function to fetch and render Pokemon based on selected types
  const fetchAndRenderPokemon = async (types) => {
    let filteredPokemon = [];

    if (types.length === 0) {
      // If no types selected, show all Pokemon from initial list
      filteredPokemon = initialPokemonList;
    } else {
      // Fetch Pokemon by type(s)
      const requests = types.map(type => {
        if (type === 'stellar' || type === 'unknown') {
          // Handle stellar and unknown types separately
          return fetch(`https://pokeapi.co/api/v2/type/${type}`)
            .then(response => response.json())
            .then(data => data.pokemon.map(p => p.pokemon));
        } else {
          return fetch(`https://pokeapi.co/api/v2/type/${type}`)
            .then(response => response.json())
            .then(data => data.pokemon.map(p => p.pokemon));
        }
      });

      const responses = await Promise.all(requests);

      // Initialize filteredPokemon with the first response
      filteredPokemon = responses[0];

      // Iterate through remaining responses and filter based on intersection
      for (let i = 1; i < responses.length; i++) {
        const currentPokemonNames = responses[i].map(pokemon => pokemon.name);
        filteredPokemon = filteredPokemon.filter(pokemon =>
          currentPokemonNames.includes(pokemon.name)
        );
      }
    }

    // Clear current list
    while (pokemonListElement.firstChild) {
      pokemonListElement.removeChild(pokemonListElement.firstChild);
    }

    // Render filtered Pokemon
    filteredPokemon.forEach(pokemon => {
      const li = document.createElement('li');
      li.textContent = pokemon.name;
      pokemonListElement.appendChild(li);
    });
  };

  // Fetch initial list of Pokemon and store it
  fetch('https://pokeapi.co/api/v2/pokemon?limit=1000')
    .then(response => response.json())
    .then(data => {
      initialPokemonList = data.results;
      // Initially render all Pokemon
      fetchAndRenderPokemon([]);
    })
    .catch(error => {
      console.error('Error fetching initial Pokemon list:', error);
    });

  // Event listener for form submit (filter apply)
  filterForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const formData = new FormData(filterForm);
    const types = formData.getAll('type');

    // Fetch and render Pokemon based on selected types
    await fetchAndRenderPokemon(types);
  });

  // Event listener for checkbox change (auto-apply filter)
  filterForm.addEventListener('change', async function(event) {
    const formData = new FormData(filterForm);
    const types = formData.getAll('type');

    // Fetch and render Pokemon based on selected types
    await fetchAndRenderPokemon(types);
  });
});
