import 'cypress-file-upload';


describe('template spec', () => {
  it('passes', () => {
    cy.visit('/');
    cy.get("#login-btn").click()
    cy.get('[name="apikey"]').type("some-api-key")
    cy.get('#submit-btn').click()
    cy.get('#create-link').click()
    cy.get('[name="name"]').type("e2e-gallery")
    cy.get('[name="author"]').type("cypress")
    cy.get(':nth-child(3) > .w-full').click()
    cy.get('.h-64 > .flex').click()
    cy.get('#file-upload').attachFile('example.jpg', { subjectType: 'drag-n-drop' });
    cy.get('#file-upload').attachFile('example2.jpg', { subjectType: 'drag-n-drop' });
    cy.get('#file-upload').attachFile('example3.jpg', { subjectType: 'drag-n-drop' });
    cy.get('#file-upload').attachFile('example4.jpg', { subjectType: 'drag-n-drop' });
    cy.get('#file-upload').attachFile('example5.jpg', { subjectType: 'drag-n-drop' });
    cy.get('#file-upload-submit').click()
    cy.get('#logo-link').click()
    cy.get('[href="/g/e2e-gallery"] > .relative > .absolute').click()
    cy.get('#admin-edit').click()
    cy.get('#del-btn').click()
    cy.get('#confirm-modal-btn').click()
  })
})