# NESTMATE — CONTROLLED E2E DATA UNIVERSE

**Purpose**: Deterministic test fixtures for mathematical score verification, filtering, sorting, connection workflows, and listing lifecycle states.

---

## 1. REFERENCE PROFILES FOR MATCHING VALIDATION

### **Reference Seeker ($S_{REF}$)**
- **UID**: `usr_seeker_ref`
- **City**: Bengaluru
- **Area**: Koramangala
- **Budget**: ₹15,000 / mo
- **Quiz Answers** (10 tokens):
  1. `sleep_time`: `before_10`
  2. `wake_time`: `6_to_8`
  3. `food_pref`: `veg`
  4. `smoking`: `never`
  5. `drinking`: `never`
  6. `guests`: `rarely`
  7. `cleanliness`: `very`
  8. `work_mode`: `hybrid`
  9. `pets`: `ok`
  10. `roommate_gender`: `any`

---

## 2. DETERMINISTIC SEEKER TEST DATASET (S001 – S010)

| Seeker ID | Name | City | Area | Budget | Quiz Answers (Shared / Matching with $S_{REF}$) | Expected Compatibility Score Calculation | Expected % |
|---|---|---|---|---|---|---|---|
| **`S001`** | Priya Sharma | Bengaluru | HSR Layout | ₹14,500 | 10/10 exact match with $S_{REF}$ | $\frac{10}{10} \times 100 = 100\%$ (Same city) | **100%** |
| **`S002`** | Rohan Verma | Bengaluru | Koramangala | ₹15,000 | 8/10 matches (`sleep: 10_to_12`, `work: wfo`, others identical) | $\frac{8}{10} \times 100 = 80\%$ (Same city) | **80%** |
| **`S003`** | Ananya Roy | Bengaluru | Indiranagar | ₹16,000 | 6/10 matches (`sleep: after_12`, `wake: 8_to_10`, `food: non_veg`, `smoking: socially`) | $\frac{6}{10} \times 100 = 60\%$ (Same city) | **60%** |
| **`S004`** | Vikram Patel | Chennai | Adyar | ₹14,000 | 10/10 matches with $S_{REF}$ BUT different city | $\min(60, \text{round}(100 \times 0.6)) = 60\%$ (Cross-city cap) | **60%** |
| **`S005`** | Neha Gupta | Bengaluru | Whitefield | ₹28,000 | 4/10 matches with $S_{REF}$ (`cleanliness: messy`, `smoking: regularly`, `drinking: regularly`, `guests: very_often`, `food: non_veg`, `sleep: after_12`) | $\frac{4}{10} \times 100 = 40\%$ (Same city) | **40%** |
| **`S006`** | Rahul Sen | Bengaluru | Electronic City | ₹12,000 | 0/10 matches (All 10 answers conflicting) | $\frac{0}{10} \times 100 = 0\%$ (Same city) | **0%** |
| **`S007`** | Sneha Nair | Hyderabad | Hitech City | ₹13,000 | 5/10 matches with $S_{REF}$ AND different city | $50\% \times 0.6 = 30\%$ | **30%** |
| **`S008`** | Arjun Reddy | Bengaluru | BTM Layout | ₹15,000 | Incomplete profile (0 quiz answers submitted) | $0$ shared keys = $0\%$ | **0%** |
| **`S009`** | Kavya Iyer | Bengaluru | Koramangala | ₹15,500 | 9/10 matches with $S_{REF}$ (`pets: no`) | $\frac{9}{10} \times 100 = 90\%$ | **90%** |
| **`S010`** | Manish Joshi | Bengaluru | HSR Layout | ₹15,000 | 7/10 matches with $S_{REF}$ | $\frac{7}{10} \times 100 = 70\%$ | **70%** |

---

## 3. DETERMINISTIC OWNER & LISTING DATASET (O001 – O007)

| Owner ID | Listing ID | City | Locality | Total Rent | Partner Share | Status | Amenities | Availability |
|---|---|---|---|---|---|---|---|---|
| **`O001`** | `lst_blr_001` | Bengaluru | Koramangala | ₹30,000 | ₹15,000 | `active` | WiFi, AC, Parking, Geyser | Immediate |
| **`O002`** | `lst_blr_002` | Bengaluru | HSR Layout | ₹24,000 | ₹12,000 | `active` | WiFi, Washing Machine, Gym | 1st of Next Month |
| **`O003`** | `lst_blr_003` | Bengaluru | Indiranagar | ₹40,000 | ₹20,000 | `active` | WiFi, AC, TV, Fridge | Immediate |
| **`O004`** | `lst_chn_001` | Chennai | Velachery | ₹20,000 | ₹10,000 | `active` | WiFi, Parking, Geyser | Immediate |
| **`O005`** | `lst_blr_paused` | Bengaluru | Whitefield | ₹28,000 | ₹14,000 | `paused` | WiFi, AC | Paused by owner |
| **`O006`** | `lst_blr_closed` | Bengaluru | Koramangala | ₹32,000 | ₹16,000 | `closed` | WiFi, Gym | Closed / Filled |
| **`O007`** | `lst_hyd_001` | Hyderabad | Gachibowli | ₹22,000 | ₹11,000 | `active` | WiFi, AC, Washing Machine | Immediate |

---

## 4. INDEPENDENT MATHEMATICAL RANKING & SORT ORDER PROOFS

### 1. **Default Compatibility Ranking for $S_{REF}$ on Seeker Dashboard**:
1. **`S001`**: **100%**
2. **`S009`**: **90%**
3. **`S002`**: **80%**
4. **`S010`**: **70%**
5. **`S003`**: **60%** (Bengaluru, 6/10)
6. **`S004`**: **60%** (Chennai, 10/10 capped at 60%)
7. **`S005`**: **40%**
8. **`S007`**: **30%**
9. **`S006`**: **0%**
10. **`S008`**: **0%** (Uncompleted quiz)

### 2. **City Filter (Bengaluru only)**:
- **Expected Records**: `S001`, `S009`, `S002`, `S010`, `S003`, `S005`, `S006`, `S008` (8 records)
- **Excluded**: `S004` (Chennai), `S007` (Hyderabad).

### 3. **Budget Filter (₹10,000 – ₹15,000)**:
- **Expected Records**: `S001` (₹14.5k), `S002` (₹15k), `S004` (₹14k), `S006` (₹12k), `S007` (₹13k), `S008` (₹15k), `S010` (₹15k).
- **Excluded**: `S003` (₹16k), `S005` (₹28k), `S009` (₹15.5k).
