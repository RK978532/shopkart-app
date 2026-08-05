# ShopKart — Amazon-jaisi E-commerce Website (Node.js + MongoDB)

Full-stack e-commerce project jisme **sab kuch Admin Panel se control hota hai**:
- Products (naam, price, photo upload, rating, badge, description)
- Categories
- Multiple homepage banners (carousel jaise Amazon mein hota hai) — size bhi adjustable
- Rotating offer/ad strip (jaise "Free Delivery" waghera)
- Product image ka size (sabhi product cards ke liye)
- Order History (sabhi orders + status update)

## ⚠️ Sabse Zaroori Baat: Data Redeploy Par Delete Kyun Ho Raha Tha

Pehle wale version mein data JSON files mein save hota tha jo **app ke saath hi hosting server ke disk par** rehti thi. Jab bhi aap naya code deploy karte the, hosting platform purana disk mita ke naya container banata tha — isliye data gayab ho jata tha.

**Fix:** Ab data **MongoDB** (ek alag, permanent cloud database) mein save hota hai jo app ke deploy/redeploy se **bilkul alag** rehta hai. Chahe aap code kitni baar bhi badlein aur redeploy karein, database wahi ka wahi rehta hai — aapke products, banners, categories, orders sab safe rahenge.

**Product/Banner photos bhi ab seedhe upload hoti hain** (URL nahi) — photo browser mein hi convert ho ke seedha isi MongoDB database mein save hoti hai, isliye woh bhi redeploy se safe rehti hai.

## Setup

### Step 1 — MongoDB Atlas (free database) banayein
1. https://www.mongodb.com/cloud/atlas/register par free account banayein
2. Ek free "M0" cluster create karein (koi credit card zaroori nahi free tier ke liye)
3. Database Access mein ek user banayein (username/password)
4. Network Access mein "Allow access from anywhere" (0.0.0.0/0) add karein
5. "Connect" → "Drivers" se apna connection string copy karein, kuch aisa dikhega:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/shopkart
   ```

### Step 2 — Project setup
```
cd shopkart-app
npm install
cp .env.example .env
```
`.env` file kholein aur `MONGODB_URI` mein apna Atlas connection string paste karein, aur `JWT_SECRET` ko ek random lambi string se replace karein.

### Step 3 — Run karein
```
npm start
```
- Store: http://localhost:3000
- Admin Panel: http://localhost:3000/admin
  - Default login → username: `admin`, password: `admin123`
  - **Pehli baar login karte hi password badal lein**

Pehli baar server chalane par kuch demo products/banners/categories apne aap ban jayenge (agar database khali hai). Uske baad jab bhi aap Admin Panel se koi change karenge, wahi permanently save rahega — dobara seed nahi hoga.

## Admin Panel Se Kya-Kya Control Hota Hai

| Tab | Kya kar sakte hain |
|---|---|
| 📦 Products | Add/Edit/Delete, photo upload, price, MRP, rating, badge, description |
| 🏷️ Categories | Add/Delete categories |
| 🖼️ Banners | Multiple homepage banners add karein (carousel), har banner ka photo upload + size (Small/Medium/Large) + order set karein |
| 📢 Offers/Ads | Rotating text strip ke liye offers/ads add-remove karein, active/inactive toggle karein |
| ⚙️ Display Size | Sabhi product cards ki photo height ek jagah se set karein |
| 📜 Order History | Sabhi orders dekhein, status update karein (Placed/Shipped/Delivered/Cancelled) |

## Hosting (Live Website Banane Ke Liye)

Node.js supporting kisi bhi hosting par deploy karein — jaise Render.com, Railway.app, Fly.io, ya apna VPS.

Deploy karte waqt environment variables set karna na bhoolein:
- `MONGODB_URI` — apka Atlas connection string
- `JWT_SECRET` — random secret string
- `PORT` — hosting platform khud set kar dega usually

Kyunki data ab MongoDB Atlas mein hai (app ke disk par nahi), aap **jitni baar chahein redeploy karein — data hamesha safe rahega.**

## API Endpoints (reference)

| Method | Route | Access | Kaam |
|---|---|---|---|
| POST | /api/auth/login | Public | Admin login |
| GET/POST/PUT/DELETE | /api/products | Public / Admin | Product CRUD |
| GET/POST/DELETE | /api/categories | Public / Admin | Category CRUD |
| GET/POST/PUT/DELETE | /api/slides | Public / Admin | Homepage banners CRUD |
| GET/POST/PUT/DELETE | /api/promo | Public / Admin | Offer/ad strip CRUD |
| GET/PUT | /api/settings | Public / Admin | Product image size |
| POST | /api/orders | Public | Checkout |
| GET | /api/orders | Admin | Poori order history |
| GET | /api/orders/track/:phone | Public | Customer apne orders dekhein |
| PUT | /api/orders/:id/status | Admin | Order status update |

## Note

Demo/starter project hai. Production ke liye: HTTPS enable karein, admin password change karein, aur payment gateway integrate karein (abhi checkout sirf order record banata hai, actual payment nahi leta). Bahut zyada high-resolution photos upload karne se database size badhega — behtar hoga photos ko upload karne se pehle compress kar lein (~200-500KB tak).
