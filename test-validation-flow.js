/**
 * Script de test pour valider le flow de validation des demandes
 * Ce script teste la chaîne complète de validation selon le type de demande
 */

const API_BASE = 'http://localhost:3000/api'

// Données de test
const testUsers = {
  superadmin: { email: 'admin@test.com', password: 'admin123' },
  technicien: { email: 'tech@test.com', password: 'tech123' },
  conducteur: { email: 'conducteur@test.com', password: 'conducteur123' },
  qhse: { email: 'qhse@test.com', password: 'qhse123' },
  appro: { email: 'appro@test.com', password: 'appro123' },
  charge_affaire: { email: 'charge@test.com', password: 'charge123' },
  logistique: { email: 'logistique@test.com', password: 'logistique123' }
}

let authTokens = {}
let testProjetId = null
let testDemandeMaterielId = null
let testDemandeOutillageId = null

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })
  
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`)
  }
  
  return data
}

async function login(userType) {
  console.log(`🔐 Connexion ${userType}...`)
  const user = testUsers[userType]
  
  try {
    const response = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(user)
    })
    
    authTokens[userType] = response.token
    console.log(`✅ ${userType} connecté`)
    return response.token
  } catch (error) {
    console.log(`❌ Erreur connexion ${userType}:`, error.message)
    return null
  }
}

async function createTestProject() {
  console.log('\n📁 Création du projet de test...')
  
  try {
    const response = await makeRequest(`${API_BASE}/projets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authTokens.superadmin}`
      },
      body: JSON.stringify({
        nom: 'Projet Test Validation Flow',
        description: 'Projet pour tester le flow de validation des demandes',
        dateDebut: '2025-01-01',
        dateFin: '2025-12-31'
      })
    })
    
    testProjetId = response.data.id
    console.log(`✅ Projet créé: ${testProjetId}`)
    return testProjetId
  } catch (error) {
    console.log('❌ Erreur création projet:', error.message)
    return null
  }
}

async function createTestDemande(type, userToken) {
  console.log(`\n📝 Création demande ${type}...`)
  
  try {
    const response = await makeRequest(`${API_BASE}/demandes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        projetId: testProjetId,
        type: type,
        items: [{
          articleId: `test-${type}-001`,
          quantiteDemandee: 5,
          commentaire: `Test article ${type}`,
          article: {
            id: `test-${type}-001`,
            nom: `Article Test ${type}`,
            description: `Description test ${type}`,
            reference: `REF-${type.toUpperCase()}-001`,
            unite: 'pièce',
            type: type
          }
        }],
        commentaires: `Demande de test pour ${type}`,
        dateLivraisonSouhaitee: '2025-02-15'
      })
    })
    
    const demandeId = response.data.id
    console.log(`✅ Demande ${type} créée: ${demandeId}`)
    console.log(`   Statut initial: ${response.data.status}`)
    
    return { id: demandeId, status: response.data.status }
  } catch (error) {
    console.log(`❌ Erreur création demande ${type}:`, error.message)
    return null
  }
}

async function validateDemande(demandeId, userType, expectedCurrentStatus) {
  console.log(`\n✅ Validation par ${userType}...`)
  
  try {
    // Vérifier le statut actuel
    const getResponse = await makeRequest(`${API_BASE}/demandes/${demandeId}`, {
      headers: {
        'Authorization': `Bearer ${authTokens[userType]}`
      }
    })
    
    console.log(`   Statut actuel: ${getResponse.data.status}`)
    
    if (getResponse.data.status !== expectedCurrentStatus) {
      console.log(`⚠️  Statut inattendu. Attendu: ${expectedCurrentStatus}, Actuel: ${getResponse.data.status}`)
    }
    
    // Valider la demande
    const response = await makeRequest(`${API_BASE}/demandes/${demandeId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authTokens[userType]}`
      },
      body: JSON.stringify({
        status: 'validee', // Le système déterminera automatiquement le prochain statut
        commentaire: `Validé par ${userType} - Test automatique`
      })
    })
    
    console.log(`✅ Demande validée par ${userType}`)
    console.log(`   Nouveau statut: ${response.data.status}`)
    
    return response.data.status
  } catch (error) {
    console.log(`❌ Erreur validation par ${userType}:`, error.message)
    return null
  }
}

async function testMaterielFlow() {
  console.log('\n🔧 === TEST FLOW MATÉRIEL ===')
  
  // Créer demande matériel
  const demande = await createTestDemande('materiel', authTokens.technicien)
  if (!demande) return false
  
  testDemandeMaterielId = demande.id
  let currentStatus = demande.status
  
  // Flow attendu: conducteur -> appro -> charge_affaire -> logistique -> technicien
  const flow = [
    { user: 'conducteur', expectedStatus: 'en_attente_validation_conducteur' },
    { user: 'appro', expectedStatus: 'en_attente_validation_appro' },
    { user: 'charge_affaire', expectedStatus: 'en_attente_validation_charge_affaire' },
    { user: 'logistique', expectedStatus: 'en_attente_validation_logistique' },
    { user: 'technicien', expectedStatus: 'en_attente_confirmation_demandeur' }
  ]
  
  for (const step of flow) {
    currentStatus = await validateDemande(testDemandeMaterielId, step.user, step.expectedStatus)
    if (!currentStatus) return false
  }
  
  console.log('✅ Flow matériel terminé avec succès!')
  return true
}

async function testOutillageFlow() {
  console.log('\n🔨 === TEST FLOW OUTILLAGE ===')
  
  // Créer demande outillage
  const demande = await createTestDemande('outillage', authTokens.technicien)
  if (!demande) return false
  
  testDemandeOutillageId = demande.id
  let currentStatus = demande.status
  
  // Flow attendu: qhse -> appro -> charge_affaire -> logistique -> technicien
  const flow = [
    { user: 'qhse', expectedStatus: 'en_attente_validation_qhse' },
    { user: 'appro', expectedStatus: 'en_attente_validation_appro' },
    { user: 'charge_affaire', expectedStatus: 'en_attente_validation_charge_affaire' },
    { user: 'logistique', expectedStatus: 'en_attente_validation_logistique' },
    { user: 'technicien', expectedStatus: 'en_attente_confirmation_demandeur' }
  ]
  
  for (const step of flow) {
    currentStatus = await validateDemande(testDemandeOutillageId, step.user, step.expectedStatus)
    if (!currentStatus) return false
  }
  
  console.log('✅ Flow outillage terminé avec succès!')
  return true
}

async function runTests() {
  console.log('🚀 DÉBUT DES TESTS DU FLOW DE VALIDATION\n')
  
  try {
    // Connexion de tous les utilisateurs
    console.log('=== PHASE 1: CONNEXIONS ===')
    for (const userType of Object.keys(testUsers)) {
      await login(userType)
    }
    
    // Vérifier que tous les tokens sont obtenus
    const missingTokens = Object.keys(testUsers).filter(user => !authTokens[user])
    if (missingTokens.length > 0) {
      console.log(`❌ Tokens manquants pour: ${missingTokens.join(', ')}`)
      console.log('⚠️  Assurez-vous que tous les utilisateurs existent dans la base de données')
      return
    }
    
    // Créer projet de test
    console.log('\n=== PHASE 2: PRÉPARATION ===')
    await createTestProject()
    if (!testProjetId) {
      console.log('❌ Impossible de créer le projet de test')
      return
    }
    
    // Tester les flows
    console.log('\n=== PHASE 3: TESTS DES FLOWS ===')
    const materielSuccess = await testMaterielFlow()
    const outillageSuccess = await testOutillageFlow()
    
    // Résumé
    console.log('\n=== RÉSUMÉ DES TESTS ===')
    console.log(`Flow Matériel: ${materielSuccess ? '✅ SUCCÈS' : '❌ ÉCHEC'}`)
    console.log(`Flow Outillage: ${outillageSuccess ? '✅ SUCCÈS' : '❌ ÉCHEC'}`)
    
    if (materielSuccess && outillageSuccess) {
      console.log('\n🎉 TOUS LES TESTS SONT PASSÉS!')
      console.log('Le flow de validation fonctionne correctement.')
    } else {
      console.log('\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ')
      console.log('Vérifiez les logs ci-dessus pour plus de détails.')
    }
    
  } catch (error) {
    console.log('❌ Erreur générale:', error.message)
  }
}

// Exécuter les tests
runTests().catch(console.error)
