# Walton SOP Maker - GitHub & Vercel Upload Guide

এই ফোল্ডারের ফাইলগুলো সরাসরি GitHub-এ আপলোড করে Vercel-এ লাইভ করার জন্য সম্পূর্ণ প্রস্তুত।

---

## 📁 ফোল্ডারের ধরন:
* **`walton-sop-maker`** : আপনার লোকাল ডেভেলপমেন্ট প্রজেক্ট (node_modules সহ)।
* **`github-upload-walton-sop-maker`** : গিটহাব আপলোডের জন্য ক্লিন ও লাইটওয়েট ফাইল (কোনো ভারী node_modules বা dist নেই)।

---

## 🚀 GitHub-এ আপলোড করার ধাপসমূহ:

1. আপনার ব্রাউজারে GitHub রিপোজিটরি ওপেন করুন:
   👉 **https://github.com/nipuruet10-creator/walton-sop-maker**

2. রিপোজিটরির ভেতরে গিয়ে **Add file** বাটনে ক্লিক করে **Upload files** সিলেক্ট করুন।

3. আপনার কম্পিউটারের এই ফোল্ডারটি ওপেন করুন:
   `E:\Antigravity\Process Automation Projects\github-upload-walton-sop-maker`

4. এই ফোল্ডারের ভেতরের সমস্ত ফাইল ও ফোল্ডার (`src`, `public`, `package.json`, `index.html`, `vite.config.ts`, ইত্যাদি) সিলেক্ট করে ব্রাউজারের ড্র্যাগ অ্যান্ড ড্রপ বক্সে ছেড়ে দিন।

5. নিচে স্ক্রোল করে **Commit changes** বাটনে ক্লিক করুন।

---

## ⚡ Vercel Deployment:
* কমিট করার সাথে সাথে Vercel স্বয়ংক্রিয়ভাবে নতুন কোডটি বিল্ড করে লাইভ করে দেবে।
* **লাইভ সাইট:** `https://walton-sop-maker.vercel.app/`
* এখন PDF ও Excel এক্সপোর্ট উভয়ই শতভাগ সঠিক লেআউট, ওয়ালটন লোগো এবং নির্মলা ইউআই (Nirmala UI) ফন্টে কোনো কাটাকাটি ছাড়াই ডাউনলোড হবে।
