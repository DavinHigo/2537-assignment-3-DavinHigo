document.addEventListener('DOMContentLoaded', function() {
  const pokemonListElement = document.getElementById('pokemonList');
  const paginationElement = document.getElementById('pagination');

  const fetchAndRenderPokemon = async (page) => {
    try {
      const response = await fetch(`/pokemon?page=${page}`);
      const data = await response.json();

      // Clear current list
      pokemonListElement.innerHTML = '';

      // Render Pokemon
      data.results.forEach(pokemon => {
        const li = document.createElement('li');
        li.textContent = pokemon.name;
        pokemonListElement.appendChild(li);
      });

      // Generate pagination controls
      renderPagination(data.count);
    } catch (error) {
      console.error('Error fetching Pokemon data:', error);
    }
  };

  const renderPagination = (totalCount) => {
    paginationElement.innerHTML = '';

    const totalPages = Math.ceil(totalCount / 10); // Assuming 10 items per page

    for (let i = 1; i <= totalPages; i++) {
      const button = document.createElement('button');
      button.textContent = i;
      button.addEventListener('click', () => fetchAndRenderPokemon(i));
      paginationElement.appendChild(button);
    }
  };

  // Initially fetch and render first page of Pokemon
  fetchAndRenderPokemon(1);
});
