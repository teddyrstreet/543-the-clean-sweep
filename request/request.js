'use strict';

const form = document.querySelector('#request-form');
const audience = form.elements.namedItem('requester');
const organization = document.querySelector('#organization-field');
const organizationInput = form.elements.namedItem('organization');
const service = form.elements.namedItem('service');
const submit = form.querySelector('button[type="submit"]');
const commercialServices = ['Commercial / janitorial', 'Government / community facility'];

function updateAudience() {
  const residential = audience.value === 'Home';
  organization.hidden = residential;
  organizationInput.disabled = residential;

  if (residential && commercialServices.includes(service.value)) {
    service.value = 'Residential';
  } else if (!residential && service.value === 'Residential') {
    service.value = commercialServices[0];
  }
}

if (new URLSearchParams(location.search).get('service') === 'residential') {
  audience.value = 'Home';
}
updateAudience();

form.addEventListener('change', event => {
  if (event.target.name === 'requester') updateAudience();
});
form.addEventListener('submit', () => {
  submit.disabled = true;
  submit.setAttribute('aria-busy', 'true');
});
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    submit.disabled = false;
    submit.removeAttribute('aria-busy');
  }
});
