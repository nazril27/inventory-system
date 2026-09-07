# 📦 Inventory System REST API

Aplikasi backend RESTful API untuk sistem manajemen inventaris barang, pengelolaan pengguna, kategori, produk, dan transaksi pemesanan berbasis Node.js, Express.js, Prisma ORM, dan PostgreSQL.

---

## 🚀 Fitur Utama

- **Autentikasi & Otorisasi**:
  - Registrasi & Login dengan JWT (JSON Web Token).
  - Refresh token & Logout (pencabutan sesi).
  - Alur Lupa Password & Reset Password dengan token dinamis.
  - Otorisasi berbasis peran (*Role-Based Access Control*): `ADMIN` & `USER`.
- **Manajemen Pengguna (User Management)**: CRUD data pengguna (khusus `ADMIN`).
- **Kategori & Produk**: CRUD kategori dan produk inventaris dengan filter nama/kategori, paginasi, dan pengurutan (*sorting*).
- **Transaksi Pesanan (Order Management)**: Pencatatan order transaksi dengan validasi stok dan pemotongan stok otomatis secara atomik (*database transaction*).
- **Dokumentasi API Interaktif**: Menggunakan Swagger UI (OpenAPI 3.0) dengan dukungan fitur *Try it out* dan Bearer Auth.

---

## 🛠️ Tech Stack

- **Runtime & Framework**: Node.js, Express.js v5 (ES Modules)
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Validasi Data**: Zod
- **Autentikasi**: Passport.js, Passport-JWT, Bcrypt.js
- **Dokumentasi API**: Swagger UI (`swagger-ui-express`, `yamljs`)
- **Testing**: Vitest, Supertest
- **Linter & Formatter**: Biome

---

## 📋 Prasyarat

- [Node.js](https://nodejs.org/) (versi 18 ke atas)
- [PostgreSQL](https://www.postgresql.org/) database

---

## ⚙️ Instalasi & Menjalankan Aplikasi

### 1. Clone Repositori
```bash
git clone <URL_REPOSITORI_GITHUB>
cd inventory-system
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env` di direktori root projek dan sesuaikan konfigurasinya:
```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/inventory_db?schema=public"
TEST_DB_URL="postgresql://username:password@localhost:5432/inventory_test_db?schema=public"

# JWT Config
JWT_SECRET="your_super_secret_jwt_key"
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30
```

### 4. Sinkronisasi Database (Prisma)
Generate Prisma Client dan terapkan skema ke database:
```bash
npx prisma generate
npx prisma db push
```

### 5. Jalankan Server
- **Mode Pengembangan (Watch Mode)**:
  ```bash
  npm run dev
  ```
- **Mode Produksi**:
  ```bash
  npm start
  ```

Aplikasi akan berjalan di `http://localhost:3000`.

---

## 📖 Dokumentasi API (Swagger UI)

Setelah server berjalan, Anda dapat mengakses dokumentasi API interaktif melalui browser:

- **Swagger UI**: [http://localhost:3000/v1/docs](http://localhost:3000/v1/docs)
- **OpenAPI JSON Spec**: [http://localhost:3000/v1/docs/swagger.json](http://localhost:3000/v1/docs/swagger.json)

---

## 🧪 Skrip Tersedia

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server dalam mode development dengan watch mode |
| `npm start` | Menjalankan server aplikasi |
| `npm test` | Menjalankan seluruh rangkaian automated tests dengan Vitest |
| `npm run coverage` | Menjalankan test dan menghasilkan laporan coverage kode |
| `npm run lint` | Memeriksa format dan standar kode menggunakan Biome |
| `npm run lint:fix` | Memperbaiki kesalahan formatting dan linting secara otomatis |
