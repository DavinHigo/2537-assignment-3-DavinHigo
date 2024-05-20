document.addEventListener('DOMContentLoaded', () => {
    const PAGE_SIZE = 10; // Number of Pokémon to fetch per page
    let currentPage = 1; // Current page index

    // Function to fetch and display all Pokémon ordered by ID
    async function fetchAllPokemons() {
        const filteredResults = document.getElementById('filtered-results');
        try {
            // Clear previous results
            filteredResults.innerHTML = '';

            // Calculate offset based on current page
            const offset = (currentPage - 1) * PAGE_SIZE;

            // Fetch Pokémon data from API
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${PAGE_SIZE}&offset=${offset}`);
            if (!response.ok) {
                throw new Error('Failed to fetch Pokémon data');
            }
            const data = await response.json();

            // Sort Pokémon by ID
            data.results.sort((a, b) => {
                const idA = parseInt(a.url.split('/')[6]);
                const idB = parseInt(b.url.split('/')[6]);
                return idA - idB;
            });

            // Display each Pokémon
            for (const pokemon of data.results) {
                try {
                    const pokemonData = await fetchPokemonData(pokemon.url);
                    if (pokemonData) {
                        // Generate card HTML for each Pokémon
                        const cardHTML = `
                            <div class="pokeCard card">
                                <h3>${pokemonData.name.toUpperCase()}</h3>
                                <img src="${pokemonData.imageUrl}" alt="${pokemonData.name}">
                                <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
                                    More
                                </button>
                            </div>
                        `;
                        filteredResults.insertAdjacentHTML('beforeend', cardHTML);
                    }
                } catch (error) {
                    console.error(`Error fetching Pokémon data (${pokemon.url}):`, error);
                    // Handle individual fetch errors gracefully (skip problematic Pokémon)
                }
            }

            // Update pagination after fetching Pokémon
            updatePagination();

        } catch (error) {
            console.error('Error fetching Pokémon:', error);
            filteredResults.innerHTML = '<p>Error fetching Pokémon</p>';
        }
    }

    // Function to fetch Pokémon data based on URL
    async function fetchPokemonData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch Pokémon data');
            }
            const data = await response.json();
            const pokemonId = data.id;
            const pokemonImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;

            return { name: data.name, imageUrl: pokemonImageUrl };
        } catch (error) {
            console.error('Error fetching Pokémon data:', error);
            return null;
        }
    }

    // Function to fetch Pokémon by type
    async function fetchPokemonsByType(type) {
        const filteredResults = document.getElementById('filtered-results');
        try {
            // Clear previous results
            filteredResults.innerHTML = '';

            // Calculate offset based on current page
            const offset = (currentPage - 1) * PAGE_SIZE;

            // Fetch Pokémon data from API by type
            const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
            if (!response.ok) {
                throw new Error('Failed to fetch Pokémon type data');
            }
            const data = await response.json();

            // Slice the array to respect pagination
            const slicedPokemon = data.pokemon.slice(offset, offset + PAGE_SIZE);

            // Display each Pokémon
            for (const entry of slicedPokemon) {
                const pokemonName = entry.pokemon.name;
                const pokemonUrl = entry.pokemon.url;
                try {
                    const pokemonData = await fetchPokemonData(pokemonUrl);
                    if (pokemonData) {
                        // Generate card HTML for each Pokémon
                        const cardHTML = `
                            <div class="pokeCard card">
                                <h3>${pokemonData.name.toUpperCase()}</h3>
                                <img src="${pokemonData.imageUrl}" alt="${pokemonData.name}">
                                <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
                                    More
                                </button>
                            </div>
                        `;
                        filteredResults.insertAdjacentHTML('beforeend', cardHTML);
                    }
                } catch (error) {
                    console.error(`Error fetching Pokémon data (${pokemonUrl}):`, error);
                    // Handle individual fetch errors gracefully (skip problematic Pokémon)
                }
            }

            // Update pagination after fetching Pokémon
            updatePagination();

        } catch (error) {
            console.error('Error fetching Pokémon:', error);
            filteredResults.innerHTML = '<p>Error fetching Pokémon</p>';
        }
    }

    // Function to fetch Pokémon with dual types
    async function fetchPokemonsByDualType(types) {
        const filteredResults = document.getElementById('filtered-results');
        try {
            // Clear previous results
            filteredResults.innerHTML = '';

            // Fetch Pokémon data for each selected type
            const promises = types.map(type => fetch(`https://pokeapi.co/api/v2/type/${type}`));
            const responses = await Promise.all(promises);
            const typeDatas = await Promise.all(responses.map(response => response.json()));

            // Get intersection of Pokémon arrays for each type
            const pokemonArrays = typeDatas.map(typeData => typeData.pokemon.map(pokemon => pokemon.pokemon.name));
            const commonPokemons = pokemonArrays.reduce((intersection, pokemonArray) => {
                return intersection.filter(pokemon => pokemonArray.includes(pokemon));
            });

            // Fetch and display Pokémon data
            for (const pokemonName of commonPokemons) {
                try {
                    const pokemonData = await fetchPokemonData(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
                    if (pokemonData) {
                        // Generate card HTML for each Pokémon
                        const cardHTML = `
                            <div class="pokeCard card">
                                <h3>${pokemonData.name.toUpperCase()}</h3>
                                <img src="${pokemonData.imageUrl}" alt="${pokemonData.name}">
                                <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
                                    More
                                </button>
                            </div>
                        `;
                        filteredResults.insertAdjacentHTML('beforeend', cardHTML);
                    }
                } catch (error) {
                    console.error(`Error fetching Pokémon data (${pokemonName}):`, error);
                    // Handle individual fetch errors gracefully (skip problematic Pokémon)
                }
            }

            // Update pagination after fetching Pokémon
            updatePagination();

        } catch (error) {
            console.error('Error fetching Pokémon:', error);
            filteredResults.innerHTML = '<p>Error fetching Pokémon</p>';
        }
    }

    // Function to update checked values and trigger fetching
    function updateCheckedValues() {
        const checkboxes = document.querySelectorAll('.pokemon-checkbox');
        const checkedValues = Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        if (checkedValues.length === 1) {
            // Fetch Pokémon based on single type
            fetchPokemonsByType(checkedValues[0]);
        } else if (checkedValues.length === 2) {
            // Fetch Pokémon based on dual types
            fetchPokemonsByDualType(checkedValues);
        } else {
            // Fetch all Pokémon if no checkboxes are checked or more than two are checked
            fetchAllPokemons();
        }
    }

    // Add change event listener to each checkbox
    const checkboxes = document.querySelectorAll('.pokemon-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Ensure no more than two checkboxes are checked at a time
            const checkedCheckboxes = Array.from(checkboxes).filter(checkbox => checkbox.checked);
            if (checkedCheckboxes.length > 2) {
                checkbox.checked = false;
            }

            // Update checked values and trigger fetching
            updateCheckedValues();
        });
    });

    // Function to update pagination buttons
    function updatePagination() {
        const paginationContainer = document.getElementById('pagination');
        paginationContainer.innerHTML = ''; // Clear existing buttons

        // Add 'Prev' button
        const prevButton = document.createElement('button');
        prevButton.classList.add('btn', 'btn-primary');
        prevButton.textContent = 'Prev';
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updateCheckedValues(); // Fetch Pokémon based on updated page
            }
        });
        paginationContainer.appendChild(prevButton);

        // Add numbered page buttons dynamically
        const maxPagesToShow = 5; // Maximum number of page buttons to show

        for (let i = Math.max(1, currentPage - 2); i <= Math.min(currentPage + 2, maxPagesToShow); i++) {
            const pageButton = document.createElement('button');
            pageButton.classList.add('btn', 'btn-primary', 'ml-1', 'page');
            pageButton.textContent = i;
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageButton.addEventListener('click', () => {
                currentPage = i;
                updateCheckedValues(); // Fetch Pokémon based on updated page
            });
            paginationContainer.appendChild(pageButton);
        }

        // Add 'Next' button
        const nextButton = document.createElement('button');
        nextButton.classList.add('btn', 'btn-primary', 'ml-1');
        nextButton.textContent = 'Next';
        nextButton.addEventListener('click', () => {
            currentPage++;
                       updateCheckedValues(); // Fetch Pokémon based on updated page
        });
        paginationContainer.appendChild(nextButton);
    }

    // Fetch Pokémon for the initial load when the page opens
    fetchAllPokemons();
});

