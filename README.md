# GameXChange Backend

Backend API untuk marketplace jual beli akun game dengan integrasi blockchain.

## Fitur

- 🔐 Authentication & Authorization (JWT)
- 🎮 Manajemen Produk Game
- 💰 Integrasi Blockchain (Ethereum)
- 📁 Upload Gambar
- 💳 Sistem Transaksi
- 🛡️ Keamanan & Validasi
- 📊 API RESTful

## Prerequisites

- Node.js (v16 atau lebih tinggi)
- MongoDB
- NPM atau Yarn

## Installation

1. **Clone repository atau buat folder baru:**

```bash
mkdir gamexchange-backend
cd gamexchange-backend
```

2. **Buat file package.json dan install dependencies:**

```bash
npm init -y
npm install express mongoose cors bcryptjs jsonwebtoken multer web3 dotenv
npm install --save-dev nodemon jest
```

3. **Setup Environment Variables:**

```bash
# Copy .env.example ke .env
cp .env.example .env
```

Edit file `.env` dan sesuaikan dengan konfigurasi Anda:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gamexchange
JWT_SECRET=your-super-secret-jwt-key-here
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
```

4. **Buat folder untuk upload file:**

```bash
mkdir uploads
```

5. **Jalankan MongoDB:**

Pastikan MongoDB berjalan di sistem Anda. Jika menggunakan Docker:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

6. **Start server:**

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Registrasi user baru
- `POST /api/auth/login` - Login user
- `PUT /api/auth/wallet` - Update wallet address

### Products

- `GET /api/products` - Get semua produk (dengan pagination & filter)
- `GET /api/products/:id` - Get detail produk
- `POST /api/products` - Buat produk baru (perlu auth)
- `PUT /api/products/:id` - Update produk (perlu auth)
- `DELETE /api/products/:id` - Hapus produk (perlu auth)

### Transactions

- `POST /api/transactions` - Buat transaksi baru
- `GET /api/transactions` - Get transaksi user
- `PUT /api/transactions/:id/status` - Update status transaksi

### Categories

- `GET /api/categories` - Get kategori dan game yang tersedia

### Users

- `GET /api/users/:id` - Get profil user

### Blockchain

- `POST /api/blockchain/verify-transaction` - Verifikasi transaksi blockchain

## Request Examples

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "gamer123",
    "email": "gamer@example.com",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gamer@example.com",
    "password": "password123"
  }'
```

### Create Product

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Akun ML Mythic Glory",
    "description": "Akun Mobile Legends dengan rank Mythic Glory 900 point",
    "game": "Mobile Legends",
    "category": "MOBA",
    "price": 0.05,
    "currency": "ETH",
    "gameDetails": {
      "level": "85",
      "rank": "Mythic Glory",
      "characters": ["Fanny", "Gusion", "Hayabusa"],
      "serverRegion": "Indonesia"
    }
  }'
```

### Get Products

```bash
curl "http://localhost:5000/api/products?page=1&limit=12&game=Mobile%20Legends"
```

## Database Schema

### User
- username (String, unique)
- email (String, unique)
- password (String, hashed)
- walletAddress (String)
- isVerified (Boolean)
- reputation (Number)

### Product
- title (String)
- description (String)
- game (String)
- category (String)
- price (Number)
- currency (String)
- images (Array)
- seller (ObjectId)
- status (enum: active/sold/inactive)
- gameDetails (Object)

### Transaction
- buyer (ObjectId)
- seller (ObjectId)
- product (ObjectId)
- amount (Number)
- currency (String)
- txHash (String)
- status (enum: pending/confirmed/failed/completed)

## Frontend Integration

Update frontend Anda untuk menggunakan API backend:

```javascript
// Contoh fetch products
const fetchProducts = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/products');
    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error('Error fetching products:', error);
  }
};

// Contoh login
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

## Security Features

- Password hashing dengan bcrypt
- JWT authentication
- File upload validation
- CORS protection
- Input sanitization
- Rate limiting (bisa ditambahkan)

## Blockchain Integration

Backend mendukung:
- Verifikasi transaksi Ethereum
- Multiple cryptocurrency (ETH, BNB, USDT)
- Smart contract integration (bisa diperluas)

## Testing

```bash
npm test
```

## Deployment

### Heroku

1. Install Heroku CLI
2. Login ke Heroku: `heroku login`
3. Buat app: `heroku create gamexchange-api`
4. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   ```
5. Deploy: `git push heroku main`

### Docker

```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## License

MIT License