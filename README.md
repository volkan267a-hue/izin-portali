# İzin & Duyuru Portalı — Firebase + Netlify Sürümü

Bu sürüm Supabase yerine **Firebase** (Auth + Firestore) ve **Netlify Functions**
kullanır. Hiçbir yerel kurulum (terminal, npm, CLI) gerekmez — her şey
tarayıcı üzerinden yapılır: Firebase Console, GitHub (dosya yükleme) ve
Netlify (Git bağlantısı).

**Neden bu ikisi?** İkisi de kredi kartı istemeyen gerçek ücretsiz planlara
sahip: Firebase Spark (Auth + Firestore) ve Netlify Free (Hosting + Functions).
Firebase'in Cloud Functions özelliği ücretli Blaze planı gerektirdiği için,
"yeni çalışan ekleme" gibi yönetici işlemlerini onun yerine **Netlify
Functions** ile yapıyoruz — o da ücretsiz ve kredi kartı istemiyor.

---

## Genel bakış: hangi adımı nerede yapacaksınız

1. **Firebase Console** (console.firebase.google.com) — Google hesabınızla giriş
2. **GitHub** (github.com) — dosyaları yüklemek için (git komutu gerekmez, web arayüzünden sürükle-bırak)
3. **Netlify** (app.netlify.com) — siteyi GitHub'a bağlayıp yayınlamak için

---

## 1. Firebase projesi oluşturun

1. [console.firebase.google.com](https://console.firebase.google.com) adresine gidin, Google hesabınızla giriş yapın.
2. **"Proje ekle"** ile yeni bir proje oluşturun (Google Analytics'i kapatabilirsiniz, gerekli değil).
3. Sol menüden **Build > Authentication**'a gidin, **"Get started"** deyin, **Sign-in method** sekmesinde **Email/Password** sağlayıcısını etkinleştirin.
4. Sol menüden **Build > Firestore Database**'e gidin, **"Create database"** deyin. Konum olarak size yakın birini seçin (örn. `eur3 (europe-west)`), **"Production mode"** seçili bırakın, oluşturun.
5. Firestore ekranında üstteki **"Rules"** sekmesine geçin. Oradaki mevcut kuralları silip, bu pakette gelen `firestore.rules` dosyasının içeriğinin TAMAMINI yapıştırın ve **"Publish"** deyin.

## 2. Web uygulaması bilgilerini alın

1. Sol üstteki dişli ikon > **Project settings**'e gidin.
2. **"Your apps"** bölümünde **"</>"** (Web) simgesine tıklayın, bir takma ad girin (örn. "izin-portali"), **"Register app"** deyin.
3. Karşınıza çıkan `firebaseConfig` nesnesini (apiKey, authDomain, projectId vb.) kopyalayın — birazdan `index.html`'e yapıştıracaksınız.

## 3. Servis hesabı anahtarını alın (admin işlemleri için)

1. Project settings > **"Service accounts"** sekmesine gidin.
2. **"Generate new private key"** deyin, indirilen `.json` dosyasını bilgisayarınıza kaydedin.
3. Bu dosyayı bir metin düzenleyicide açın, **içeriğinin tamamını** kopyalayın — bunu birazdan Netlify'a ortam değişkeni olarak gireceksiniz. (Bu dosyayı kimseyle paylaşmayın, GitHub'a da yüklemeyin — çok güçlü bir yetkilendirme anahtarıdır.)

## 4. index.html dosyanızı düzenleyin

Bu pakette gelen `index.html` dosyasını bir metin düzenleyicide açın. Ctrl+F ile
`YOUR-API-KEY` arayın, şu bloğu bulun:

```js
const firebaseConfig = {
  apiKey: 'YOUR-API-KEY',
  authDomain: 'YOUR-PROJECT-ID.firebaseapp.com',
  projectId: 'YOUR-PROJECT-ID',
  storageBucket: 'YOUR-PROJECT-ID.appspot.com',
  messagingSenderId: 'YOUR-SENDER-ID',
  appId: 'YOUR-APP-ID'
};
```

2. adımda kopyaladığınız gerçek `firebaseConfig` değerleriyle değiştirin. Kaydedin.

## 5. GitHub'a yükleyin (git komutu gerekmez)

1. [github.com](https://github.com) adresinde ücretsiz bir hesap oluşturun (yoksa).
2. Sağ üstteki **"+"** > **"New repository"** ile yeni bir depo oluşturun. Adını
   örn. `izin-portali` yapın, **"Public"** veya **"Private"** fark etmez, **"Create repository"** deyin.
3. Açılan sayfada **"uploading an existing file"** linkine tıklayın.
4. Bu paketteki **TÜM dosya ve klasörleri** (index.html, netlify.toml, package.json,
   firestore.rules, netlify/ klasörü — .git veya README hariç hepsi) sürükleyip
   bırakın. Klasör yapısının korunması için `netlify` klasörünü bir bütün olarak
   sürükleyin (GitHub'ın web yükleyicisi alt klasörleri korur).
5. Altta **"Commit changes"** deyin.

## 6. Netlify'a bağlayın

1. [app.netlify.com](https://app.netlify.com) adresinde ücretsiz bir hesap oluşturun (GitHub ile giriş yapmanız en kolayı).
2. **"Add new site"** > **"Import an existing project"** deyin.
3. **"Deploy with GitHub"** seçin, izin verin, az önce oluşturduğunuz `izin-portali` deposunu seçin.
4. Build ayarlarına dokunmadan **"Deploy"** deyin. Netlify, `netlify.toml` dosyasını otomatik algılar ve fonksiyonları kurar. Birkaç dakika içinde siteniz yayında olur.

## 7. Servis hesabı anahtarını Netlify'a ortam değişkeni olarak ekleyin

1. Netlify'da sitenize gidin > **Site configuration** > **Environment variables**.
2. **"Add a variable"** deyin. Key: `FIREBASE_SERVICE_ACCOUNT_KEY`. Value kısmına, 3. adımda kopyaladığınız `.json` dosyasının **TÜM içeriğini** (süslü parantezlerle birlikte) yapıştırın.
3. Kaydedin. Sonra **Deploys** sekmesinden **"Trigger deploy" > "Deploy site"** ile siteyi yeniden dağıtın (ortam değişkeni ancak yeni bir deploy'da devreye girer).

## 8. İlk admin kullanıcınızı oluşturun

Bu adımda henüz "Yeni Çalışan Ekle" arayüzünü kullanamazsınız (çünkü sistemde
hiç admin yok, giriş yapamazsınız) — bu yüzden ilk admin'i Firebase Console
üzerinden elle oluşturuyoruz:

1. Firebase Console > Authentication > **Users** sekmesine gidin.
2. **"Add user"** deyin. E-posta olarak `admin@calisan.portal.local` gibi bir şey,
   şifre olarak istediğiniz bir şifre girin. **"Add user"** deyin.
3. Oluşan kullanıcının **UID** değerini kopyalayın (satırın solunda görünür).
4. Firestore Database > **Data** sekmesine gidin. **"Start collection"** ile
   `profiles` adında bir koleksiyon oluşturun. Document ID olarak 3. adımda
   kopyaladığınız UID'yi yapıştırın. Şu alanları tek tek ekleyin:

   | Alan adı | Tür | Değer |
   |---|---|---|
   | registryNumber | string | 1000 |
   | email | string | admin@calisan.portal.local (2. adımda girdiğiniz) |
   | firstName | string | Yönetici |
   | lastName | string | Hesabı |
   | department | string | Genel |
   | role | string | admin |
   | annualLeaveTotal | number | 14 |
   | annualLeaveUsed | number | 0 |
   | flexibleHoursStart | string | 09:00 |
   | flexibleHoursEnd | string | 18:00 |
   | flexibleWorkNote | string | Standart mesai |

   **"Save"** deyin.

5. Aynı ekranda **"Start collection"** ile bu sefer `registryLookup` adında
   ikinci bir koleksiyon oluşturun. Document ID olarak `1000` (seçtiğiniz sicil
   numarası) yazın. Tek bir alan ekleyin: `email` (string) = `admin@calisan.portal.local`.
   **"Save"** deyin.

## 9. Giriş yapın

Netlify'ın size verdiği linki (örn. `https://izin-portali-xxxx.netlify.app`)
tarayıcıda açın. **Sicil No: 1000**, **Şifre:** 2. adımda belirlediğiniz şifre
ile giriş yapın. Yönetici Paneli'ne yönlendirileceksiniz.

Bundan sonraki tüm çalışanları artık **"Yeni Çalışan Ekle"** ekranından
ekleyebilirsiniz — Firestore'a elle veri girmenize gerek kalmaz, bu sadece
ilk admin hesabı için gerekliydi.

---

## Klasör yapısı

```
izin-portal-firebase/
├─ index.html                          # Sitenin kendisi
├─ netlify.toml                        # Netlify yapılandırması (functions dizini)
├─ package.json                        # Netlify Functions bağımlılığı (firebase-admin)
├─ firestore.rules                     # Firestore güvenlik kuralları
└─ netlify/functions/
   ├─ _shared.js                       # Ortak yardımcı kod (admin doğrulama vb.)
   ├─ create-employee.js               # Tekil çalışan oluşturma
   ├─ bulk-import-employees.js         # Toplu içeri aktarma
   └─ delete-employee.js               # Çalışan silme
```

## Sonradan güncelleme yapmak isterseniz

`index.html`'de bir değişiklik yaptığınızda, dosyayı GitHub deponuza tekrar
yükleyin (aynı dosya adıyla üzerine yazın) — Netlify bunu otomatik algılayıp
siteyi yeniden yayınlar, ekstra bir işlem gerekmez.

## Sınırlamalar

- Firestore güvenlik kuralları, çalışanların sadece kendi verilerini
  görebilmesini veritabanı seviyesinde garanti eder (React/Supabase sürümündeki
  RLS'nin Firebase karşılığı).
- `registryLookup` koleksiyonu bilerek minimal tutulmuştur (sadece e-posta),
  böylece oturum açmadan önce herkesin okuyabilmesi güvenlik açığı yaratmaz.
