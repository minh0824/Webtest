# Hashing Visualizer

Trang web minh hoa truc quan cach thuat toan hashing xu ly chuoi theo tung ky tu.

## Tinh nang

- Nhap chuoi bat ky va quan sat hash thay doi sau moi ky tu.
- Dieu khien tung buoc bang slider, nut lui, nut tien, chay tu dong va reset.
- Ho tro 3 thuat toan:
  - Polynomial rolling hash
  - DJB2
  - FNV-1a 32-bit
- Hien thi cong thuc tinh hash o tung buoc.
- Hien thi dau van tay nhi phan 32-bit va gia tri hex.
- Minh hoa bucket trong bang hash de thay cach key duoc phan bo.
- So sanh avalanche effect khi thay doi chuoi dau vao.

## Chay local

Co the mo truc tiep file `index.html` bang trinh duyet.

Hoac chay local server:

```bash
python3 -m http.server 8000
```

Sau do mo:

```text
http://localhost:8000
```

## Cau truc file

```text
.
├── index.html
├── styles.css
└── app.js
```

## Cong nghe

- HTML
- CSS
- JavaScript thuan

Khong can cai dat dependency.
