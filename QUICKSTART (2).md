# 🚀 DIGIY PAY — Démarrage Rapide

Guide pour avoir DIGIY PAY opérationnel en **moins de 10 minutes** ! ⚡

---

## ⏱️ Setup en 10 Minutes

### 1️⃣ Clone & Install (2 min)

```bash
# Clone le repo
git clone https://github.com/beauville/digiy-pay.git
cd digiy-pay

# Install dependencies
npm install
```

### 2️⃣ Configure Firebase (3 min)

```bash
# Crée un projet Firebase sur console.firebase.google.com

# Copie le template d'environnement
cp .env.example .env

# Édite .env avec tes credentials Firebase
nano .env
```

**Remplis ces variables dans `.env`:**
```env
REACT_APP_FIREBASE_API_KEY=ta_clé_ici
REACT_APP_FIREBASE_AUTH_DOMAIN=ton_projet.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=ton_projet
# ... etc
```

### 3️⃣ Lance l'App (1 min)

```bash
# Démarre l'app en mode développement
npm start

# Ouvre http://localhost:3000
```

### 4️⃣ Test Mode Sandbox (4 min)

```bash
# L'app est configurée en mode sandbox par défaut
# Tu peux tester sans vraies API keys!

# Teste les fonctionnalités:
# 1. Créer un compte
# 2. Recharger le wallet (mode simulation)
# 3. Faire un transfert
# 4. Voir l'historique
```

**🎉 Bravo ! DIGIY PAY tourne ! 🎉**

---

## 🔥 Mode Production

### Prérequis

Pour passer en production, tu as besoin de:

- ✅ Compte Firebase (gratuit)
- ✅ Compte Wave (si tu veux Wave)
- ✅ Compte Orange Money (si tu veux Orange Money)
- ✅ Domaine pour webhooks

### Setup Production

#### 1. Configure les API Keys

**Wave API:**
```bash
# Inscris-toi sur https://developer.wave.com
# Obtiens tes API keys
# Ajoute dans .env:
REACT_APP_WAVE_API_KEY=live_xxx
REACT_APP_WAVE_MODE=production
```

**Orange Money:**
```bash
# Contacte Orange Money Sénégal: +221 33 869 60 00
# Obtiens tes credentials
# Ajoute dans .env:
REACT_APP_ORANGE_API_KEY=live_xxx
REACT_APP_ORANGE_MODE=live
```

#### 2. Configure les Webhooks

```javascript
// functions/webhooks.js
exports.waveWebhook = functions.https.onRequest((req, res) => {
  const event = req.body;
  
  // Vérifie la signature
  const signature = req.headers['x-wave-signature'];
  if (!verifySignature(signature, event)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process event
  switch(event.type) {
    case 'payment.success':
      handlePaymentSuccess(event.data);
      break;
    case 'payment.failed':
      handlePaymentFailed(event.data);
      break;
  }
  
  res.json({ received: true });
});
```

#### 3. Deploy Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (si pas déjà fait)
firebase init

# Deploy
npm run deploy
```

#### 4. Configure le Domaine

```bash
# Dans Firebase Console:
# 1. Va dans Hosting
# 2. Ajoute ton domaine custom
# 3. Configure les DNS

# Exemple:
# pay.digiylyfe.com → Firebase Hosting
```

---

## 🧪 Tests

### Tests Unitaires

```bash
# Run tous les tests
npm test

# Run avec coverage
npm run test:coverage

# Run en mode watch
npm test -- --watch
```

### Tests d'Intégration

```bash
# Test avec vraies API (mode sandbox)
npm run test:integration

# Test paiement Wave
npm run test:wave

# Test paiement Orange Money
npm run test:orange
```

### Test Manuel

**1. Test Recharge:**
```bash
# 1. Ouvre l'app
# 2. Clique "Recharger"
# 3. Entre 5000 FCFA
# 4. Choisis Wave
# 5. Scan le QR Code
# 6. Vérifie que le solde augmente
```

**2. Test Transfert:**
```bash
# 1. Clique "Envoyer"
# 2. Entre destinataire: +221771234567
# 3. Entre montant: 1000 FCFA
# 4. Confirme
# 5. Vérifie la transaction dans l'historique
```

---

## 📱 Intégration dans tes Apps

### React/React Native

```bash
# Install DIGIY PAY
npm install digiy-pay

# Ou depuis GitHub
npm install git+https://github.com/beauville/digiy-pay.git
```

```javascript
// Import
import DigiyPay from 'digiy-pay';

// Initialize
const pay = new DigiyPay({
  apiKey: process.env.REACT_APP_DIGIY_API_KEY,
  mode: 'production'
});

// Use
const payment = await pay.charge({
  amount: 15000,
  recipient: '+221771234567',
  method: 'wave'
});
```

### Vanilla JavaScript

```html
<!-- Include SDK -->
<script src="https://cdn.digiylyfe.com/digiy-pay/v1/digiy-pay.min.js"></script>

<script>
  // Initialize
  const pay = DigiyPay.init({
    apiKey: 'your_api_key',
    mode: 'production'
  });

  // Use
  pay.charge({
    amount: 15000,
    recipient: '+221771234567',
    method: 'wave'
  }).then(payment => {
    console.log('Success!', payment);
  });
</script>
```

### Backend (Node.js)

```javascript
// Install
npm install digiy-pay-node

// Use
const DigiyPay = require('digiy-pay-node');

const pay = new DigiyPay({
  apiKey: process.env.DIGIY_API_KEY,
  secret: process.env.DIGIY_SECRET
});

// Process payment
app.post('/api/charge', async (req, res) => {
  try {
    const payment = await pay.charge({
      amount: req.body.amount,
      recipient: req.body.recipient,
      method: req.body.method
    });
    
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

## 🐛 Debugging

### Problèmes Communs

**1. Firebase Connection Failed**
```bash
# Vérifie tes credentials dans .env
# Vérifie que Firebase est bien initialisé
# Check la console: firebase.google.com
```

**2. Payment Failed**
```bash
# En mode sandbox: normal, c'est une simulation
# En mode production:
#   - Vérifie les API keys
#   - Vérifie le solde du compte
#   - Check les logs Firebase Functions
```

**3. Webhook Not Received**
```bash
# Vérifie que ton URL est accessible
# Test avec: curl https://ton-domaine.com/webhooks/test
# Vérifie les logs Firebase Functions
# Check que la signature est correcte
```

### Logs

```bash
# Logs Firebase Functions
firebase functions:log

# Logs en temps réel
firebase functions:log --only waveWebhook

# Logs Firestore
# Va dans Firebase Console > Firestore > Logs
```

---

## 📚 Resources

### Documentation

- 📘 [Guide Complet](./README.md)
- 🔌 [API Reference](./docs/api-reference.md)
- 🎨 [Design System](./docs/design-system.md)
- 🔐 [Sécurité](./docs/security.md)

### Exemples

- [DIGIY DRIVER Integration](./examples/driver.js)
- [DIGIY LOC Integration](./examples/loc.js)
- [DIGIY RESTO Integration](./examples/resto.js)
- [Webhook Handler](./examples/webhooks.js)

### Support

- 📧 Email: digiylyfe@gmail.com
- 📱 WhatsApp: [+221 77 134 28 89](https://wa.me/221771342889)
- 💬 Chat: [DIGIY CHAT PRO](https://beauville.github.io/digiy-chat-pro/)

---

## 🎯 Checklist Avant Production

Avant de déployer en production, vérifie:

- [ ] ✅ Firebase configuré correctement
- [ ] ✅ API keys Wave/Orange en production
- [ ] ✅ Webhooks configurés et testés
- [ ] ✅ Domaine personnalisé configuré
- [ ] ✅ SSL/HTTPS activé
- [ ] ✅ Tests passent (npm test)
- [ ] ✅ Security rules Firebase déployées
- [ ] ✅ Backup activé sur Firestore
- [ ] ✅ Monitoring configuré
- [ ] ✅ Documentation à jour

---

## 🚀 Next Steps

**Tu es prêt à lancer ! Maintenant:**

1. 🧪 Teste en sandbox
2. 🔐 Obtiens les vraies API keys
3. 🚀 Deploy en production
4. 📣 Annonce à tes utilisateurs
5. 💰 Commence à traiter des paiements!

**Remember:**
- 0% de commission
- 100% pour les pros
- L'Afrique enracinée, connectée au monde

---

<div align="center">

## ∞

**GO GO GO FRÉROT! 🔥**

**Pierre par pierre, on construit l'écosystème! 💎**

[⭐ Star le repo](https://github.com/beauville/digiy-pay) | [📖 Documentation](./README.md) | [💬 Support](https://wa.me/221771342889)

</div>
