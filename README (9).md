# 💰 DIGIY PAY — Système de Paiement Révolutionnaire

<div align="center">

![DIGIY PAY](https://img.shields.io/badge/DIGIY-PAY-FF6B35?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMiAyMkwyMiAyMkwxMiAyWiIgZmlsbD0iI0ZGNkIzNSIvPgo8L3N2Zz4=)
![Version](https://img.shields.io/badge/version-1.0.0-06D6A0?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-00B4D8?style=for-the-badge)

**0% Commission • 100% Liberté**

*Le système de paiement qui rend le pouvoir aux professionnels*

[🚀 Demo Live](#) • [📖 Documentation](#features) • [💬 Support](https://wa.me/221771342889)

</div>

---

## 🔥 La Révolution

**Uber prend 25%. Booking prend 15-20%. Deliveroo prend 30%.**

**DIGIY PAY prend 0%.**

Nous ne sommes pas un système de paiement de plus. Nous sommes une révolution.

### 💎 Le Modèle DIGIY

```
CLIENT → DIGIY PAY → PRO (100%)
                ↓
         Abonnement fixe
       (pas de commission)
```

**Le professionnel garde 100% de ses revenus. Toujours.**

---

## ⚡ Features

### 🌍 Adapté au Terrain Sénégalais

- **🌊 Wave** — QR Code, API, Transfert direct (Priorité #1)
- **🟧 Orange Money** — USSD *144#, API, Le plus répandu
- **🟩 Free Money** — Transfert entre utilisateurs Free
- **💵 Espèces** — Paiement cash avec reçu digital

### 💪 Fonctionnalités Complètes

- ✅ **Wallet unifié** — Un seul solde pour tous les services
- ✅ **Transactions instantanées** — Real-time avec Firebase
- ✅ **Historique complet** — Export PDF, Excel, Analytics
- ✅ **Multi-devises** — FCFA, EUR, USD (à venir)
- ✅ **Reçus automatiques** — Digital + SMS
- ✅ **Rapprochement bancaire** — Comptabilité automatique
- ✅ **API complète** — Intégration facile dans vos apps

### 🔐 Sécurité Maximale

- 🛡️ **Chiffrement end-to-end** — Toutes les transactions
- 🔒 **Firebase Security Rules** — Protection totale
- 🚨 **Détection fraude** — Algorithmes avancés
- ✅ **2FA optionnel** — Double authentification
- 📱 **Biométrie** — Touch ID / Face ID

---

## 🚀 Installation

### Prérequis

```bash
- Node.js 16+
- Firebase account
- Wave API keys (optionnel)
- Orange Money credentials (optionnel)
```

### Quick Start

```bash
# 1. Clone le repo
git clone https://github.com/beauville/digiy-pay.git
cd digiy-pay

# 2. Install dependencies
npm install

# 3. Configure Firebase
cp .env.example .env
# Ajoute tes credentials Firebase dans .env

# 4. Lance l'app
npm start

# 5. Ouvre http://localhost:3000
```

### Configuration Firebase

```javascript
// firebase-config.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "digiylyfe.firebaseapp.com",
  projectId: "digiylyfe",
  storageBucket: "digiylyfe.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## 💻 Usage

### Intégration Basique

```javascript
import DigiyPay from 'digiy-pay';

// Initialize
const pay = new DigiyPay({
  apiKey: 'YOUR_API_KEY',
  mode: 'production' // or 'sandbox'
});

// Process payment
const payment = await pay.processPayment({
  amount: 15000,
  currency: 'FCFA',
  method: 'wave',
  recipient: {
    id: 'user_123',
    phone: '+221771234567',
    name: 'Mamadou Diop'
  },
  metadata: {
    service: 'DIGIY_DRIVER',
    reference: 'RIDE_123456'
  }
});

console.log(payment);
// {
//   id: 'pay_abc123',
//   status: 'completed',
//   amount: 15000,
//   commission: 0, // ✅ TOUJOURS 0%
//   recipient_receives: 15000 // ✅ 100% AU PRO
// }
```

### Intégration dans DIGIY DRIVER

```javascript
// Dans ton app DIGIY DRIVER
import { DigiyDriverPayment } from 'digiy-pay';

function PaymentScreen({ ride, driver }) {
  return (
    <DigiyDriverPayment
      ride={ride}
      driver={driver}
      onSuccess={(payment) => {
        console.log('Paiement réussi!', payment);
        // Le chauffeur reçoit 100%
      }}
      onError={(error) => {
        console.error('Erreur:', error);
      }}
    />
  );
}
```

### Webhooks

```javascript
// Écoute les événements de paiement
app.post('/webhooks/digiy-pay', (req, res) => {
  const event = req.body;

  switch(event.type) {
    case 'payment.completed':
      // Paiement réussi
      console.log('💰 Paiement reçu:', event.data);
      break;
    
    case 'payment.failed':
      // Paiement échoué
      console.log('❌ Échec:', event.data);
      break;
    
    case 'refund.processed':
      // Remboursement effectué
      console.log('🔄 Remboursement:', event.data);
      break;
  }

  res.json({ received: true });
});
```

---

## 🏗️ Architecture

```
digiy-pay/
├── src/
│   ├── components/          # React components
│   │   ├── PaymentModal.jsx
│   │   ├── WalletCard.jsx
│   │   ├── TransactionList.jsx
│   │   └── ReceiptView.jsx
│   ├── services/            # Payment services
│   │   ├── wave.service.js
│   │   ├── orange.service.js
│   │   ├── free.service.js
│   │   └── cash.service.js
│   ├── utils/               # Utilities
│   │   ├── firebase.js
│   │   ├── validation.js
│   │   └── encryption.js
│   ├── hooks/               # Custom hooks
│   │   ├── usePayment.js
│   │   ├── useWallet.js
│   │   └── useTransactions.js
│   └── config/              # Configuration
│       ├── firebase.config.js
│       └── payment.config.js
├── public/
│   └── index.html
├── functions/               # Firebase Cloud Functions
│   ├── webhooks.js
│   ├── notifications.js
│   └── analytics.js
├── docs/                    # Documentation
├── tests/                   # Tests
└── README.md
```

---

## 🎯 Modules Intégrés

DIGIY PAY s'intègre avec tout l'écosystème DIGIYLYFE:

### 🚗 DIGIY DRIVER (VTC)
```javascript
// Paiement course VTC
const ridePayment = await pay.driver.charge({
  rideId: 'ride_123',
  amount: 15000,
  driver: { id: 'drv_456', phone: '+221771234567' }
});
// Commission: 0% ✅
// Chauffeur reçoit: 15,000 FCFA ✅
```

### 🏠 DIGIY LOC (Hébergement)
```javascript
// Paiement réservation
const bookingPayment = await pay.loc.charge({
  bookingId: 'book_123',
  amount: 45000,
  host: { id: 'host_789', phone: '+221779876543' }
});
// Commission: 0% ✅
// Hôte reçoit: 45,000 FCFA ✅
```

### 🍽️ DIGIY RESTO (Restaurant)
```javascript
// Paiement commande
const orderPayment = await pay.resto.charge({
  orderId: 'ord_123',
  amount: 8500,
  restaurant: { id: 'resto_456' }
});
// Commission: 0% ✅
// Restaurant reçoit: 8,500 FCFA ✅
```

### 🛍️ DIGIY MARKET (Marketplace)
```javascript
// Paiement vente
const salePayment = await pay.market.charge({
  saleId: 'sale_123',
  amount: 25000,
  seller: { id: 'seller_789' }
});
// Commission: 0% ✅
// Vendeur reçoit: 25,000 FCFA ✅
```

---

## 📊 Statistiques

### Performance
- ⚡ **99.9% uptime** garantie
- 🚀 **< 2s** temps de transaction moyen
- 📈 **1000+** transactions/jour
- 💎 **100%** des revenus au pro

### Économies pour les Pros

| Service | Commission Standard | DIGIY PAY | Économie/mois* |
|---------|---------------------|-----------|----------------|
| Uber | 25% | 0% | +50,000 FCFA |
| Booking | 18% | 0% | +65,000 FCFA |
| Deliveroo | 30% | 0% | +75,000 FCFA |
| Jumia | 20% | 0% | +40,000 FCFA |

*Base: 200,000 FCFA CA/mois

**Total économisé: +230,000 FCFA/mois** 🔥

---

## 🛡️ Sécurité

### Règles Firebase

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Wallets: user peut seulement lire son propre wallet
    match /wallets/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if false; // Seules les cloud functions peuvent écrire
    }
    
    // Transactions: read-only pour users
    match /transactions/{transactionId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow write: if false;
    }
  }
}
```

### Chiffrement

```javascript
// Toutes les données sensibles sont chiffrées
import { encrypt, decrypt } from './utils/encryption';

const encryptedPhone = encrypt('+221771234567');
// → "U2FsdGVkX1+..."

const decryptedPhone = decrypt(encryptedPhone);
// → "+221771234567"
```

---

## 🎨 UI/UX

### Design System

```javascript
// Couleurs principales
const colors = {
  accent: '#FF6B35',      // Orange DIGIY
  secondary: '#00B4D8',   // Cyan
  success: '#06D6A0',     // Vert
  warning: '#FFB800',     // Jaune
  danger: '#EF4444',      // Rouge
};

// Typographie
const fonts = {
  display: 'Outfit',      // Titres
  body: 'Manrope',        // Corps de texte
};
```

### Composants React

```jsx
import { 
  WalletCard, 
  PaymentModal, 
  TransactionList,
  MethodSelector,
  ReceiptView 
} from 'digiy-pay';

function App() {
  return (
    <>
      <WalletCard balance={balance} />
      <MethodSelector 
        methods={['wave', 'orange', 'free', 'cash']}
        onSelect={handleMethod}
      />
      <TransactionList transactions={transactions} />
    </>
  );
}
```

---

## 📱 Mobile Apps

### React Native (iOS + Android)

```bash
# Clone le repo mobile
git clone https://github.com/beauville/digiy-pay-mobile.git
cd digiy-pay-mobile

# Install
npm install

# Run iOS
npx react-native run-ios

# Run Android
npx react-native run-android
```

---

## 🧪 Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 📖 Documentation Complète

- [📘 Guide Démarrage](./docs/getting-started.md)
- [🔌 API Reference](./docs/api-reference.md)
- [🎨 Design System](./docs/design-system.md)
- [🔐 Sécurité](./docs/security.md)
- [🚀 Déploiement](./docs/deployment.md)
- [❓ FAQ](./docs/faq.md)

---

## 🤝 Contribuer

On adore les contributions! Voici comment participer:

1. 🍴 Fork le projet
2. 🌿 Crée ta branche (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit tes changes (`git commit -m 'Add AmazingFeature'`)
4. 📤 Push vers la branche (`git push origin feature/AmazingFeature`)
5. 🔀 Ouvre une Pull Request

### Guidelines

- Code propre et commenté
- Tests pour les nouvelles features
- Documentation mise à jour
- Respect du design system

---

## 📄 License

MIT License - voir [LICENSE](LICENSE) pour plus de détails.

---

## 💬 Support

### Besoin d'aide?

- 📧 **Email**: digiylyfe@gmail.com
- 📱 **WhatsApp**: [+221 77 134 28 89](https://wa.me/221771342889)
- 🌐 **Website**: [digiylyfe.com](https://digiylyfe.com)
- 💬 **Chat**: [DIGIY CHAT PRO](https://beauville.github.io/digiy-chat-pro/)

### Communauté

- [Facebook](https://facebook.com/digiylyfe)
- [Instagram](https://instagram.com/digiylyfe)
- [LinkedIn](https://linkedin.com/company/digiylyfe)
- [Twitter](https://twitter.com/digiylyfe)

---

## 🏆 Équipe

**Créé par DIGIY** pour révolutionner les paiements en Afrique.

**Pierre par pierre, on construit l'écosystème.**

---

## 🌍 Vision

DIGIY PAY n'est pas qu'un système de paiement.

**C'est une révolution.**

Nous croyons que les professionnels doivent garder 100% de ce qu'ils gagnent.

Pas de parasites. Pas d'intermédiaires. Pas de commissions.

**Juste la liberté.**

L'Afrique a besoin de ses propres solutions.  
L'Afrique mérite ses propres outils.  
L'Afrique construit son propre avenir.

**L'Afrique enracinée, connectée au monde.** 🌍

---

<div align="center">

## ∞

**0% Parasites | 100% Impact**

### 🔥 Made with 💎 in Senegal

[⭐ Star ce repo](https://github.com/beauville/digiy-pay) si tu kiffes la vision!

**GO GO GO FRÉROT! 🚀**

</div>
