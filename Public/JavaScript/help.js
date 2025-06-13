document.addEventListener('DOMContentLoaded', function() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');

  accordionHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const accordionItem = this.parentElement;
      const accordionContent = accordionItem.querySelector('.accordion-content');
      const isActive = this.classList.contains('active');

      
      accordionHeaders.forEach(otherHeader => {
        if (otherHeader !== this) {
          otherHeader.classList.remove('active');
          otherHeader.parentElement.querySelector('.accordion-content').classList.remove('active');
        }
      });

      
      if (isActive) {
        this.classList.remove('active');
        accordionContent.classList.remove('active');
      } else {
        this.classList.add('active');
        accordionContent.classList.add('active');
      }
    });
  });

  
  const searchInput = document.getElementById('searchInput');
  const accordionItems = document.querySelectorAll('.accordion-item');
  const faqSections = document.querySelectorAll('.faq-section');

  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();

    if (searchTerm === '') {
      
      accordionItems.forEach(item => {
        item.style.display = 'block';
      });
      faqSections.forEach(section => {
        section.style.display = 'block';
      });
      return;
    }

    
    faqSections.forEach(section => {
      section.style.display = 'none';
    });

    
    accordionItems.forEach(item => {
      const header = item.querySelector('.accordion-header span').textContent.toLowerCase();
      const content = item.querySelector('.accordion-content').textContent.toLowerCase();

      if (header.includes(searchTerm) || content.includes(searchTerm)) {
        item.style.display = 'block';
        
        const parentSection = item.closest('.faq-section');
        if (parentSection) {
          parentSection.style.display = 'block';
        }
      } else {
        item.style.display = 'none';
      }
    });
  });

  
  const quickLinks = document.querySelectorAll('.quick-link-card');
  quickLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const headerHeight = document.querySelector('.site-header').offsetHeight;
        const targetPosition = targetElement.offsetTop - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
});