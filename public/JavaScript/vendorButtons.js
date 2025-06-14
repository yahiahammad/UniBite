document.addEventListener('DOMContentLoaded', function() {
    // Get all vendor buttons
    const vendorButtons = document.querySelectorAll('.view-menu');

    // Map display names to database names
    const vendorNameMap = {
        'My Corner': 'MyCorner',
        'Gyro for the rescue!': 'Gyro',
        'Batates & Zalabya!': 'Batates & Zalabya',
        'Man\'oucheh': 'Man\'oucheh',
        'Cinnabon is here!': 'Cinnabon',
        'RtoGO got you': 'R2Go',
        'Cool-Down at Farghaly': 'Ashraf Farghaly Juices',
        'The Bakery shop': 'The Bakery Shop'
    };

    // Add click event listener to each button
    vendorButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            // Get the vendor name from the h2 element
            const displayName = this.closest('.card-back-content').querySelector('h2').textContent;

            // Get the database name from the map
            const dbName = vendorNameMap[displayName];

            if (!dbName) {
                console.error('No mapping found for vendor:', displayName);
                return;
            }

            // Redirect to the vendor's menu page
            // The requireLogin middleware will handle authentication check
            window.location.href = `/stores/${encodeURIComponent(dbName)}`;
        });
    });
});