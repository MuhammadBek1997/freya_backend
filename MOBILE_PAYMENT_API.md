# Mobile Payment Card API Documentation

Bu dokumentatsiya Flutter mobile app dasturchilar uchun payment card API'larini batafsil tushuntiradi.

## Base URL
```
Production: https://your-api-domain.com/api
Development: http://localhost:5000/api
```

## Authentication
Barcha API'lar JWT token bilan himoyalangan. Header'da token yuborish kerak:
```
Authorization: Bearer <your_jwt_token>
```

## Payment Card Endpoints

### 1. Get User Payment Cards
Foydalanuvchining barcha to'lov kartalarini olish.

**Endpoint:** `GET /payment-cards`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "card_number": "****1234",
      "cardholder_name": "John Doe", 
      "expiry_date": "12/25",
      "card_type": "visa",
      "phone": "+998901234567",
      "is_default": true,
      "last_four": "1234",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "payment_summary": {
    "total_cards": 3,
    "has_default": true
  }
}
```

### 2. Add New Payment Card
Yangi to'lov kartasi qo'shish.

**Endpoint:** `POST /payment-cards`

**Request Body:**
```json
{
  "card_number": "4111111111111111",
  "cardholder_name": "John Doe",
  "expiry_date": "12/25",
  "cvv": "123",
  "phone": "+998901234567",
  "is_default": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your phone",
  "data": {
    "verification_id": "abc123",
    "phone": "+998901234567"
  }
}
```

### 3. Verify and Save Card
SMS kod bilan kartani tasdiqlash va saqlash.

**Endpoint:** `POST /payment-cards/verify`

**Request Body:**
```json
{
  "verification_id": "abc123",
  "verification_code": "123456",
  "card_number": "4111111111111111",
  "cardholder_name": "John Doe",
  "expiry_date": "12/25",
  "cvv": "123",
  "phone": "+998901234567",
  "is_default": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment card added successfully",
  "data": {
    "id": 2,
    "card_number": "****1111",
    "cardholder_name": "John Doe",
    "card_type": "visa",
    "is_default": false
  }
}
```

### 4. Update Payment Card
To'lov kartasini yangilash.

**Endpoint:** `PUT /payment-cards/:id`

**Request Body:**
```json
{
  "cardholder_name": "John Smith",
  "expiry_date": "12/26",
  "phone": "+998901234567"
}
```

### 5. Delete Payment Card
To'lov kartasini o'chirish.

**Endpoint:** `DELETE /payment-cards/:id`

**Response:**
```json
{
  "success": true,
  "message": "Payment card deleted successfully"
}
```

### 6. Set Default Card
Kartani asosiy qilib belgilash.

**Endpoint:** `PUT /payment-cards/:id/default`

**Response:**
```json
{
  "success": true,
  "message": "Default card updated successfully"
}
```

## Mobile-Specific Endpoints

### 7. Get Payment Card Statistics
Mobil app uchun kartalar statistikasi.

**Endpoint:** `GET /payment-cards/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_cards": 3,
    "active_cards": 2,
    "default_card": {
      "id": 1,
      "last_four": "1234",
      "card_type": "visa",
      "cardholder_name": "John Doe"
    },
    "card_types": {
      "visa": 2,
      "mastercard": 1,
      "uzcard": 0
    },
    "recent_activity": {
      "last_added": "2024-01-15T10:30:00Z",
      "last_used": "2024-01-20T14:45:00Z"
    }
  }
}
```

### 8. Real-time Card Validation
Karta raqamini real-time tekshirish (typing paytida).

**Endpoint:** `POST /payment-cards/validate`

**Request Body:**
```json
{
  "card_number": "4111111111111111"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_valid": true,
    "card_type": "visa",
    "formatted_number": "4111 1111 1111 1111",
    "last_four": "1111",
    "validation_errors": []
  }
}
```

**Invalid Card Response:**
```json
{
  "success": true,
  "data": {
    "is_valid": false,
    "card_type": "unknown",
    "formatted_number": "1234 5678 9012 3456",
    "last_four": "3456",
    "validation_errors": [
      "Invalid card number format",
      "Card type not supported"
    ]
  }
}
```

### 9. Get Supported Card Types
Qo'llab-quvvatlanadigan karta turlari.

**Endpoint:** `GET /payment-cards/supported-types`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "visa",
      "name": "Visa",
      "pattern": "^4[0-9]{12}(?:[0-9]{3})?$",
      "icon": "visa-icon.svg",
      "color": "#1A1F71",
      "length": [13, 16, 19]
    },
    {
      "type": "mastercard",
      "name": "Mastercard", 
      "pattern": "^5[1-5][0-9]{14}$",
      "icon": "mastercard-icon.svg",
      "color": "#EB001B",
      "length": [16]
    },
    {
      "type": "uzcard",
      "name": "UzCard",
      "pattern": "^8600[0-9]{12}$",
      "icon": "uzcard-icon.svg",
      "color": "#00A651",
      "length": [16]
    },
    {
      "type": "humo",
      "name": "Humo",
      "pattern": "^9860[0-9]{12}$",
      "icon": "humo-icon.svg", 
      "color": "#FF6B35",
      "length": [16]
    }
  ]
}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "card_number": "Invalid card number format",
    "expiry_date": "Expiry date must be in MM/YY format"
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required",
  "message": "Please provide valid JWT token"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Payment card not found",
  "message": "Card with ID 123 does not exist"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Something went wrong. Please try again later."
}
```

## Flutter Integration Examples

### 1. Card List Widget
```dart
class PaymentCardsList extends StatefulWidget {
  @override
  _PaymentCardsListState createState() => _PaymentCardsListState();
}

class _PaymentCardsListState extends State<PaymentCardsList> {
  List<PaymentCard> cards = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchPaymentCards();
  }

  Future<void> fetchPaymentCards() async {
    try {
      final response = await ApiService.get('/payment-cards');
      if (response['success']) {
        setState(() {
          cards = (response['data'] as List)
              .map((card) => PaymentCard.fromJson(card))
              .toList();
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() => isLoading = false);
      // Handle error
    }
  }
}
```

### 2. Real-time Card Validation
```dart
class CardNumberField extends StatefulWidget {
  final Function(CardValidation) onValidation;
  
  @override
  _CardNumberFieldState createState() => _CardNumberFieldState();
}

class _CardNumberFieldState extends State<CardNumberField> {
  Timer? _debounceTimer;
  
  void _onCardNumberChanged(String value) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(Duration(milliseconds: 500), () {
      _validateCard(value);
    });
  }
  
  Future<void> _validateCard(String cardNumber) async {
    if (cardNumber.length >= 13) {
      try {
        final response = await ApiService.post('/payment-cards/validate', {
          'card_number': cardNumber.replaceAll(' ', '')
        });
        
        if (response['success']) {
          widget.onValidation(CardValidation.fromJson(response['data']));
        }
      } catch (e) {
        // Handle validation error
      }
    }
  }
}
```

### 3. Card Statistics Dashboard
```dart
class PaymentStatsWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<PaymentStats>(
      future: ApiService.getPaymentStats(),
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          final stats = snapshot.data!;
          return Column(
            children: [
              _buildStatCard('Total Cards', stats.totalCards.toString()),
              _buildStatCard('Active Cards', stats.activeCards.toString()),
              if (stats.defaultCard != null)
                _buildDefaultCardInfo(stats.defaultCard!),
            ],
          );
        }
        return CircularProgressIndicator();
      },
    );
  }
}
```

## Security Notes

1. **Karta raqamlari** - Backend'da AES-256 bilan shifrlangan
2. **CVV kodlari** - Hech qachon saqlanmaydi
3. **SMS verifikatsiya** - Har bir karta qo'shish uchun majburiy
4. **JWT tokenlar** - 24 soat amal qiladi
5. **Rate limiting** - Har bir IP uchun minutiga 60 ta so'rov

## Testing

Test kartalar:
- **Visa:** 4111111111111111
- **Mastercard:** 5555555555554444
- **UzCard:** 8600123456789012
- **Humo:** 9860123456789012

Barcha test kartalari uchun:
- **Expiry:** 12/25
- **CVV:** 123
- **Phone:** +998901234567