# Daftar User Stories StudyTrack

Kelompok 8 · Disusun oleh Kayla Mahavira (System Analyst & QA) · Dosen pengampu: Yusuf Lestanto, M.Sc

Total **21 user story** dengan **95 Story Points**. Story Points memakai skala 1, 2, 3, 5, 8, 13. Prioritas: **Must** (wajib), **Should** (penting), **Could** (tambahan jika waktu cukup). Acceptance Criteria memakai format BDD (Given, When, Then).

## Ringkasan

| ID | User Story | SP | Prioritas | Epik |
|---|---|---|---|---|
| [US-01](#us-01) | Login | 3 | Must | A |
| [US-02](#us-02) | Registrasi akun | 3 | Must | A |
| [US-03](#us-03) | Kelola profil dan preferensi notifikasi | 5 | Must | A |
| [US-04](#us-04) | Kelola data tugas | 5 | Must | B |
| [US-05](#us-05) | Daftar tugas berdasarkan status | 3 | Should | B |
| [US-06](#us-06) | Lihat deadline di Dashboard dan Kalender | 5 | Must | B |
| [US-07](#us-07) | Lihat statistik produktivitas | 3 | Could | B |
| [US-08](#us-08) | Atur rencana belajar harian | 3 | Could | B |
| [US-09](#us-09) | Pengecekan deadline otomatis | 5 | Must | C |
| [US-10](#us-10) | Identifikasi tugas H-7 dan H-3 | 5 | Must | C |
| [US-11](#us-11) | Ambil data kontak dan preferensi pengguna | 3 | Must | C |
| [US-12](#us-12) | Notifikasi pengingat via email | 8 | Must | C |
| [US-13](#us-13) | Notifikasi pengingat via WhatsApp | 13 | Must | C |
| [US-14](#us-14) | Catat status pengiriman notifikasi | 5 | Must | C |
| [US-15](#us-15) | Cegah notifikasi ganda | 5 | Must | C |
| [US-16](#us-16) | Pengiriman ulang notifikasi gagal | 5 | Should | C |
| [US-17](#us-17) | Notification Center di Dashboard | 5 | Should | D |
| [US-18](#us-18) | Badge status notifikasi di Kalender | 3 | Could | D |
| [US-19](#us-19) | Keamanan kredensial layanan pihak ketiga | 2 | Must | E |
| [US-20](#us-20) | Antarmuka responsif lintas perangkat dan browser | 3 | Should | E |
| [US-21](#us-21) | Akurasi waktu pengiriman notifikasi | 3 | Must | E |
| | **Total** | **95** | | |

---

## Epik A — Akun dan Profil

<a id="us-01"></a>

### US-01 · Login

**3 SP · Must**

> Sebagai mahasiswa, saya ingin login ke StudyTrack agar dapat mengakses data tugas saya.

**Acceptance Criteria (BDD)**

**Scenario 1: Login berhasil**

- **Given** saya sudah memiliki akun terdaftar
- **When** saya memasukkan email dan password yang benar
- **Then** saya diarahkan ke Dashboard

**Scenario 2: Login gagal**

- **Given** saya berada di halaman login
- **When** saya memasukkan password yang salah
- **Then** sistem menampilkan pesan kesalahan dan saya tetap berada di halaman login

<a id="us-02"></a>

### US-02 · Registrasi akun

**3 SP · Must**

> Sebagai calon pengguna, saya ingin mendaftar akun beserta nomor telepon agar dapat menerima notifikasi WhatsApp.

**Acceptance Criteria (BDD)**

**Scenario 1: Registrasi berhasil**

- **Given** saya belum memiliki akun
- **When** saya mengisi nama, email, password, dan nomor telepon dengan format valid
- **Then** akun terbentuk dan saya dapat login

**Scenario 2: Nomor telepon tidak valid**

- **Given** saya berada di form registrasi
- **When** saya mengisi nomor telepon dengan format yang salah
- **Then** sistem menolak pengiriman form dan menampilkan pesan validasi

**Scenario 3: Email sudah terdaftar**

- **Given** email saya sudah dipakai oleh akun lain
- **When** saya mencoba mendaftar dengan email tersebut
- **Then** sistem menampilkan pesan bahwa email sudah terdaftar

**Scenario 4: Kejelasan tujuan data**

- **Given** saya berada di form registrasi
- **When** saya melihat kolom nomor telepon
- **Then** tujuan penggunaan nomor (khusus notifikasi) dijelaskan secara eksplisit

<a id="us-03"></a>

### US-03 · Kelola profil dan preferensi notifikasi

**5 SP · Must**

> Sebagai mahasiswa, saya ingin mengubah nomor telepon, email, username, password, serta mengaktifkan atau menonaktifkan channel notifikasi agar notifikasi sesuai kebutuhan saya.

**Acceptance Criteria (BDD)**

**Scenario 1: Ubah nomor telepon**

- **Given** saya berada di halaman profil
- **When** saya mengganti nomor telepon dengan format valid lalu menyimpan
- **Then** notifikasi WhatsApp berikutnya dikirim ke nomor yang baru

**Scenario 2: Nonaktifkan channel**

- **Given** notifikasi WhatsApp saya aktif
- **When** saya menonaktifkan notifikasi WhatsApp di halaman profil
- **Then** nilai notif_wa_aktif tersimpan sebagai nonaktif

**Scenario 3: Ubah password**

- **Given** saya berada di halaman profil
- **When** saya memasukkan password baru yang memenuhi ketentuan lalu menyimpan
- **Then** password baru berlaku pada login berikutnya

---

## Epik B — Manajemen Tugas dan Tampilan

<a id="us-04"></a>

### US-04 · Kelola data tugas

**5 SP · Must**

> Sebagai mahasiswa, saya ingin menambah, melihat, dan mengubah tugas agar seluruh deadline saya tercatat.

**Acceptance Criteria (BDD)**

**Scenario 1: Tambah tugas**

- **Given** saya sudah login
- **When** saya mengisi judul, mata kuliah, deadline, prioritas, dan deskripsi lalu menyimpan
- **Then** tugas muncul di daftar tugas saya

**Scenario 2: Field wajib kosong**

- **Given** saya membuka form tugas
- **When** saya menyimpan tanpa mengisi judul atau deadline
- **Then** sistem menampilkan pesan bahwa field wajib harus diisi

**Scenario 3: Ubah tugas**

- **Given** saya memiliki tugas yang sudah tersimpan
- **When** saya mengubah deadline tugas tersebut lalu menyimpan
- **Then** deadline baru tersimpan dan menjadi dasar pengecekan H-7/H-3 berikutnya

<a id="us-05"></a>

### US-05 · Daftar tugas berdasarkan status

**3 SP · Should**

> Sebagai mahasiswa, saya ingin memfilter tugas berdasarkan status agar fokus pada tugas yang belum selesai.

**Acceptance Criteria (BDD)**

**Scenario 1: Filter belum selesai**

- **Given** saya memiliki tugas berstatus selesai dan belum selesai
- **When** saya memilih filter "belum selesai"
- **Then** hanya tugas berstatus belum selesai yang ditampilkan

**Scenario 2: Filter semua**

- **Given** saya berada di halaman daftar tugas
- **When** saya memilih filter "semua"
- **Then** seluruh tugas saya ditampilkan

<a id="us-06"></a>

### US-06 · Lihat deadline di Dashboard dan Kalender

**5 SP · Must**

> Sebagai mahasiswa, saya ingin melihat deadline terdekat di Dashboard dan Kalender agar mengetahui tugas yang perlu dikerjakan lebih dahulu.

**Acceptance Criteria (BDD)**

**Scenario 1: Dashboard**

- **Given** saya memiliki beberapa tugas aktif
- **When** saya membuka Dashboard
- **Then** tugas ditampilkan berurutan dari deadline terdekat

**Scenario 2: Kalender**

- **Given** saya memiliki tugas dengan deadline pada tanggal tertentu
- **When** saya membuka Kalender
- **Then** tugas tampil pada tanggal deadline-nya

<a id="us-07"></a>

### US-07 · Lihat statistik produktivitas

**3 SP · Could**

> Sebagai mahasiswa, saya ingin melihat total tugas, total jam belajar, dan grafik 7 hari terakhir agar dapat memantau produktivitas belajar.

**Acceptance Criteria (BDD)**

**Scenario 1: Statistik tampil**

- **Given** saya memiliki data tugas dan aktivitas belajar
- **When** saya membuka halaman Statistik
- **Then** total tugas, total jam belajar, dan grafik 7 hari terakhir ditampilkan

**Scenario 2: Belum ada data**

- **Given** saya belum memiliki aktivitas belajar
- **When** saya membuka halaman Statistik
- **Then** sistem menampilkan nilai nol atau pesan bahwa data belum tersedia

<a id="us-08"></a>

### US-08 · Atur rencana belajar harian

**3 SP · Could**

> Sebagai mahasiswa, saya ingin mencatat dan menandai rencana belajar harian agar aktivitas belajar saya terstruktur.

**Acceptance Criteria (BDD)**

**Scenario 1: Tambah aktivitas**

- **Given** saya sudah login
- **When** saya menambahkan aktivitas belajar pada tanggal tertentu
- **Then** aktivitas tersimpan di rencana belajar harian saya

**Scenario 2: Tandai selesai**

- **Given** saya memiliki aktivitas yang belum selesai
- **When** saya menandai aktivitas tersebut selesai
- **Then** status is_done berubah menjadi selesai

---

## Epik C — Scheduler dan Notifikasi Multi-Channel

<a id="us-09"></a>

### US-09 · Pengecekan deadline otomatis

**5 SP · Must**

> Sebagai sistem, saya ingin menjalankan pengecekan deadline secara berkala agar pengingat tidak bergantung pada aktivitas pengguna.

**Acceptance Criteria (BDD)**

**Scenario 1: Scheduler berjalan periodik**

- **Given** scheduler sudah aktif
- **When** interval pengecekan tercapai (maksimal setiap 1 jam)
- **Then** sistem memeriksa seluruh tugas yang belum selesai

**Scenario 2: Scheduler mengalami error**

- **Given** terjadi error saat pengecekan
- **When** scheduler dijalankan
- **Then** error dicatat dan scheduler tetap berjalan pada siklus berikutnya

<a id="us-10"></a>

### US-10 · Identifikasi tugas H-7 dan H-3

**5 SP · Must**

> Sebagai sistem, saya ingin mengidentifikasi tugas yang mencapai H-7 dan H-3 agar pengingat dikirim pada waktu yang tepat.

**Acceptance Criteria (BDD)**

**Scenario 1: Tugas mencapai H-7**

- **Given** tugas berstatus belum selesai dengan deadline 7 hari lagi
- **When** scheduler berjalan
- **Then** tugas ditandai untuk pengingat periode H-7

**Scenario 2: Tugas mencapai H-3**

- **Given** tugas berstatus belum selesai dengan deadline 3 hari lagi
- **When** scheduler berjalan
- **Then** tugas ditandai untuk pengingat periode H-3

**Scenario 3: Tugas sudah selesai**

- **Given** tugas berstatus selesai dengan deadline 3 hari lagi
- **When** scheduler berjalan
- **Then** tugas tidak ditandai untuk pengingat

<a id="us-11"></a>

### US-11 · Ambil data kontak dan preferensi pengguna

**3 SP · Must**

> Sebagai sistem, saya ingin membaca data kontak dan preferensi notifikasi pengguna sebelum mengirim agar pesan hanya dikirim ke channel yang aktif.

**Acceptance Criteria (BDD)**

**Scenario 1: Kontak tersedia**

- **Given** tugas pengguna ditandai untuk pengingat
- **When** sistem membaca data pengguna
- **Then** email dan nomor WhatsApp beserta status aktif tiap channel berhasil diambil

**Scenario 2: Channel nonaktif dilewati**

- **Given** notifikasi email pengguna nonaktif
- **When** tugasnya mencapai H-7 atau H-3
- **Then** sistem tidak mengirim email dan hanya memproses channel yang aktif

**Scenario 3: Semua channel nonaktif**

- **Given** notifikasi email dan WhatsApp pengguna sama-sama nonaktif
- **When** tugasnya mencapai H-7 atau H-3
- **Then** tidak ada notifikasi yang dikirim

<a id="us-12"></a>

### US-12 · Notifikasi pengingat via email

**8 SP · Must**

> Sebagai mahasiswa, saya ingin menerima pengingat deadline lewat email agar mengetahui tugas yang mendekati tenggat tanpa membuka aplikasi.

**Acceptance Criteria (BDD)**

**Scenario 1: Email terkirim**

- **Given** tugas saya mencapai H-7 atau H-3 dan notifikasi email saya aktif
- **When** sistem mengirim notifikasi
- **Then** saya menerima email berisi judul tugas, mata kuliah, prioritas, deadline, dan sisa waktu

**Scenario 2: Prioritas tidak diubah**

- **Given** tugas saya berprioritas Tinggi
- **When** email pengingat dikirim
- **Then** prioritas ditampilkan apa adanya dan sistem tidak mengubah prioritas tugas

**Scenario 3: Layanan email bermasalah**

- **Given** layanan SMTP sedang tidak dapat dihubungi
- **When** sistem mencoba mengirim email
- **Then** pengiriman ditandai failed dan diteruskan ke mekanisme pengiriman ulang

<a id="us-13"></a>

### US-13 · Notifikasi pengingat via WhatsApp

**13 SP · Must**

> Sebagai mahasiswa, saya ingin menerima pengingat lewat WhatsApp agar pengingat sampai di aplikasi yang paling sering saya buka.

**Acceptance Criteria (BDD)**

**Scenario 1: WhatsApp terkirim**

- **Given** tugas saya mencapai H-7 atau H-3, notifikasi WhatsApp aktif, dan nomor saya valid
- **When** sistem memanggil WhatsApp Business API
- **Then** saya menerima pesan berisi judul tugas, mata kuliah, prioritas, deadline, dan sisa waktu

**Scenario 2: Nomor tidak valid atau kosong**

- **Given** nomor telepon saya kosong atau tidak valid
- **When** sistem mencoba mengirim WhatsApp
- **Then** pengiriman ditandai failed beserta alasannya

**Scenario 3: Verifikasi API belum selesai**

- **Given** verifikasi bisnis Meta Cloud API belum selesai
- **When** sistem akan mengirim WhatsApp
- **Then** sistem menggunakan penyedia alternatif (mis. Fonnte) sebagai jalur sementara

<a id="us-14"></a>

### US-14 · Catat status pengiriman notifikasi

**5 SP · Must**

> Sebagai tim pengembang, saya ingin status setiap notifikasi tercatat per channel agar keandalan sistem dapat dipantau.

**Acceptance Criteria (BDD)**

**Scenario 1: Status sukses**

- **Given** sistem berhasil mengirim notifikasi lewat email
- **When** pengiriman selesai
- **Then** tabel notifications mencatat status sent beserta waktu_kirim dan notification_logs mencatat perubahan status

**Scenario 2: Status gagal**

- **Given** pengiriman WhatsApp mengalami error
- **When** pengiriman selesai
- **Then** status tercatat failed beserta keterangan error

**Scenario 3: Status menunggu**

- **Given** notifikasi sudah dijadwalkan namun belum diproses
- **When** sistem membuat catatan notifikasi
- **Then** status tercatat pending

<a id="us-15"></a>

### US-15 · Cegah notifikasi ganda

**5 SP · Must**

> Sebagai mahasiswa, saya tidak ingin menerima notifikasi yang sama berulang agar tidak terganggu.

**Acceptance Criteria (BDD)**

**Scenario 1: Notifikasi sudah terkirim**

- **Given** notifikasi H-3 untuk tugas X via email sudah berstatus sent
- **When** scheduler berjalan lagi pada siklus berikutnya
- **Then** sistem tidak mengirim ulang notifikasi H-3 via email untuk tugas X

**Scenario 2: Channel berbeda**

- **Given** notifikasi H-3 via email untuk tugas X sudah terkirim
- **When** sistem memproses channel WhatsApp untuk tugas yang sama
- **Then** notifikasi WhatsApp tetap dikirim

**Scenario 3: Periode berbeda**

- **Given** notifikasi H-7 untuk tugas X sudah terkirim
- **When** tugas X mencapai H-3
- **Then** notifikasi H-3 tetap dikirim

<a id="us-16"></a>

### US-16 · Pengiriman ulang notifikasi gagal

**5 SP · Should**

> Sebagai tim pengembang, saya ingin notifikasi yang gagal dicoba kirim ulang agar gangguan sementara tidak membuat pengingat hilang.

**Acceptance Criteria (BDD)**

**Scenario 1: Retry dilakukan**

- **Given** notifikasi berstatus failed dan percobaan_ke kurang dari 3
- **When** scheduler berjalan
- **Then** sistem mencoba mengirim ulang dan menambah nilai percobaan_ke

**Scenario 2: Batas retry tercapai**

- **Given** percobaan_ke sudah mencapai 3
- **When** scheduler berjalan
- **Then** sistem berhenti mencoba dan status tetap failed

**Scenario 3: Retry berhasil**

- **Given** notifikasi berstatus failed
- **When** pengiriman ulang berhasil
- **Then** status berubah menjadi sent dan perubahan tercatat di notification_logs

---

## Epik D — Notification Center dan Indikator Visual

<a id="us-17"></a>

### US-17 · Notification Center di Dashboard

**5 SP · Should**

> Sebagai mahasiswa, saya ingin melihat riwayat notifikasi di Dashboard agar mengetahui pengingat apa saja yang sudah dikirim.

**Acceptance Criteria (BDD)**

**Scenario 1: Riwayat tampil**

- **Given** sistem sudah mengirim beberapa notifikasi untuk saya
- **When** saya membuka Notification Center
- **Then** daftar notifikasi tampil lengkap dengan channel, periode H-7/H-3, dan status

**Scenario 2: Belum ada notifikasi**

- **Given** belum ada notifikasi untuk saya
- **When** saya membuka Notification Center
- **Then** tampil pesan bahwa belum ada notifikasi

<a id="us-18"></a>

### US-18 · Badge status notifikasi di Kalender

**3 SP · Could**

> Sebagai mahasiswa, saya ingin melihat badge status notifikasi di Kalender agar mengetahui tugas mana yang sudah diingatkan.

**Acceptance Criteria (BDD)**

**Scenario 1: Badge terkirim**

- **Given** notifikasi untuk tugas X berstatus sent
- **When** saya membuka Kalender
- **Then** tugas X menampilkan badge status terkirim

**Scenario 2: Badge gagal**

- **Given** notifikasi untuk tugas Y berstatus failed
- **When** saya membuka Kalender
- **Then** tugas Y menampilkan badge status gagal

---

## Epik E — Kebutuhan Non-Fungsional

<a id="us-19"></a>

### US-19 · Keamanan kredensial layanan pihak ketiga

**2 SP · Must**

> Sebagai tim pengembang, saya ingin kredensial SMTP dan WhatsApp API disimpan di environment variable agar tidak bocor.

**Acceptance Criteria (BDD)**

**Scenario 1: Tidak ada kredensial di kode**

- **Given** kode sudah masuk repository
- **When** kode diperiksa
- **Then** tidak ditemukan kredensial SMTP atau WhatsApp API di dalam source code

**Scenario 2: Environment variable belum diatur**

- **Given** environment variable belum tersedia
- **When** sistem mencoba mengirim notifikasi
- **Then** pengiriman gagal dengan pesan konfigurasi yang jelas dan kredensial tidak tampil di log

<a id="us-20"></a>

### US-20 · Antarmuka responsif lintas perangkat dan browser

**3 SP · Should**

> Sebagai mahasiswa, saya ingin StudyTrack nyaman dipakai di HP maupun laptop tanpa instalasi tambahan agar dapat diakses di mana saja.

**Acceptance Criteria (BDD)**

**Scenario 1: Akses dari HP**

- **Given** saya membuka StudyTrack lewat browser HP
- **When** halaman dimuat
- **Then** tata letak menyesuaikan layar dan fitur utama dapat digunakan

**Scenario 2: Browser berbeda**

- **Given** saya memakai Chrome, Edge, atau Firefox
- **When** saya membuka StudyTrack
- **Then** tampilan dan fungsi berjalan normal

<a id="us-21"></a>

### US-21 · Akurasi waktu pengiriman notifikasi

**3 SP · Must**

> Sebagai tim QA, saya ingin memastikan notifikasi terkirim tepat pada periode H-7/H-3 agar sistem memenuhi target keandalan.

**Acceptance Criteria (BDD)**

**Scenario 1: Target akurasi tercapai**

- **Given** tersedia data uji tugas dengan deadline H-7 dan H-3 di lingkungan pengujian
- **When** scheduler dijalankan dan hasil pengiriman dihitung
- **Then** minimal 95% notifikasi terkirim pada periode yang ditentukan

**Scenario 2: Target tidak tercapai**

- **Given** akurasi pengiriman di bawah 95%
- **When** hasil pengujian dievaluasi
- **Then** kegagalan dicatat dalam laporan pengujian untuk ditindaklanjuti
