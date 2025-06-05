document.addEventListener("DOMContentLoaded", () => {
  // Food locations on campus
  const FOOD_LOCATIONS = [
    { id: 1, name: "Gyro", description: "Greek-inspired wraps and bowls", lat: 30.171282, lng: 31.491855 },
    { id: 2, name: "MyCorner", description: "Egyptian sandwiches", lat: 30.169247, lng: 31.492369 },
    { id: 3, name: "Man'oucheh", description: "Lebanese flatbreads and pastries", lat: 30.169247, lng: 31.492369 },
    { id: 4, name: "Cinnabon", description: "Fresh baked cinnamon rolls", lat: 30.169226, lng: 31.491773 },
    { id: 5, name: "R2Go", description: "Quick meals and grab-and-go options", lat: 30.168626, lng: 31.492429 },
    { id: 6, name: "Batates & Zalabya", description: "Fries and dessert", lat: 30.170832, lng: 31.491603 },
  ]

  // Default MIU coordinates
  const DEFAULT_LOCATION = { lat: 30.169673, lng: 31.491933 }

  // Initialize the map if the element exists
  const mapElement = document.getElementById("campus-map")
  if (mapElement) {
    initializeMap()
  }

  function initializeMap() {
    // Create map container
    const mapContainer = document.createElement("div")
    mapContainer.className = "map-container"
    mapContainer.style.height = "100%"
    mapContainer.style.position = "relative"

    // Create locations list
    const locationsList = document.createElement("div")
    locationsList.className = "locations-list"
    locationsList.innerHTML = `
      <div class="locations-header">
        <h3>UniBite Pickup Locations</h3>
      </div>
      <div class="locations-items"></div>
    `

    // Replace placeholder with actual map content
    mapElement.innerHTML = ""
    mapElement.appendChild(mapContainer)
    mapElement.appendChild(locationsList)

    // Add styles
    const style = document.createElement("style")
    style.textContent = `
      .map-container {
        background-color: #f0f0f0;
        border-radius: 0.5rem 0.5rem 0 0;
        overflow: hidden;
        height: 60%;
      }
      
      .locations-list {
        background-color: white;
        border-top: 1px solid #e5e5e5;
        border-radius: 0 0 0.5rem 0.5rem;
        height: 40%;
        overflow: auto;
      }
      
      .locations-header {
        padding: 1rem;
        border-bottom: 1px solid #e5e5e5;
      }
      
      .locations-header h3 {
        margin: 0;
        font-size: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .locations-header h3::before {
        content: '';
        display: inline-block;
        width: 1rem;
        height: 1rem;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23FF8A00' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 8.5H3'/%3E%3Cpath d='M21 15.5H3'/%3E%3Cpath d='M21 3H3'/%3E%3Cpath d='M11 21H3'/%3E%3C/svg%3E");
        background-size: contain;
        background-repeat: no-repeat;
      }
      
      .locations-items {
        padding: 0.5rem;
      }
      
      .location-item {
        padding: 0.75rem;
        border-radius: 0.5rem;
        margin-bottom: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
      }
      
      .location-item:hover {
        background-color: #f9f9f9;
      }
      
      .location-item.active {
        background-color: rgba(255, 138, 0, 0.1);
        border-color: rgba(255, 138, 0, 0.3);
      }
      
      .location-item h4 {
        margin: 0 0 0.25rem;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .location-item h4::before {
        content: '';
        display: inline-block;
        width: 1rem;
        height: 1rem;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23FF8A00' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E%3C/svg%3E");
        background-size: contain;
        background-repeat: no-repeat;
      }
      
      .location-item p {
        margin: 0;
        font-size: 0.75rem;
        color: #666;
      }
      
      .location-item.active p.status {
        color: #FF8A00;
        font-weight: 500;
        margin-top: 0.25rem;
      }
    `
    document.head.appendChild(style)

    // Add map image
    const mapImage = document.createElement("img")
    mapImage.src =
      "https://maps.googleapis.com/maps/api/staticmap?center=30.169673,31.491933&zoom=17&size=600x400&maptype=satellite&key=YOUR_API_KEY"
    mapImage.alt = "MIU Campus Map"
    mapImage.style.width = "100%"
    mapImage.style.height = "100%"
    mapImage.style.objectFit = "cover"
    mapContainer.appendChild(mapImage)

    // Populate locations list
    const locationsItemsContainer = locationsList.querySelector(".locations-items")
    FOOD_LOCATIONS.forEach((location) => {
      const locationItem = document.createElement("div")
      locationItem.className = "location-item"
      locationItem.dataset.id = location.id
      locationItem.innerHTML = `
        <h4>${location.name}</h4>
        <p>${location.description}</p>
      `

      locationItem.addEventListener("click", function () {
        // Remove active class from all items
        document.querySelectorAll(".location-item").forEach((item) => {
          item.classList.remove("active")
          const statusElement = item.querySelector(".status")
          if (statusElement) {
            statusElement.remove()
          }
        })

        // Add active class to clicked item
        this.classList.add("active")

        // Add status text
        const statusElement = document.createElement("p")
        statusElement.className = "status"
        statusElement.textContent = "Currently viewing"
        this.appendChild(statusElement)

        // Update map (in a real implementation, this would pan/zoom the map)
        console.log(`Selected location: ${location.name} at ${location.lat}, ${location.lng}`)
      })

      locationsItemsContainer.appendChild(locationItem)
    })
  }
})
