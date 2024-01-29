# Asset-Hexa-Server
## APIs
- API: [https://asset-hexa-server.vercel.app](https://asset-hexa-server.vercel.app)
- Post API for account: [https://asset-hexa-server.vercel.app/accounts](https://asset-hexa-server.vercel.app/accounts)
- Get API for account. Example:
```
https://asset-hexa-server.vercel.app/accounts?email=front@example.com
```

- Post INCOME API for transections: 
- Post EXPENSE API for transections:
- Example
```
Example: https://asset-hexa-server.vercel.app/transections?type=INCOME&email=backend@example.com
Example: https://asset-hexa-server.vercel.app/transections?type=EXPENSE&email=backend@example.com
```

- Get API for transections: 
- Example:
```
https://asset-hexa-server.vercel.app/transections?type=INCOME&email=backend@example.com
https://asset-hexa-server.vercel.app/transections?type=EXPENSE&email=backend@example.com
https://asset-hexa-server.vercel.app/transections?type=TRANSFER&email=backend@example.com
```

## Object Example For Post INCOME API for transections
```
[
    {
        "date": "",
        "account": "Cash",
        "type": "INCOME",
        "category": "Salary",
        "amount": 5000,
        "note": "First Income"
    },
    {
        "date": "",
        "account": "Cash",
        "type": "EXPENSE",
        "category": "Food",
        "amount": 2000,
        "note": "First Income"
    },
    {
        "date": "",
        "account": "Cash",
        "type": "TRANSFER",
        "to": "Bkash",
        "amount": 2000,
        "note": "First Income"
    }
]
```
- API GET For PI chart separated by categorys https://asset-hexa-server.vercel.app/catPi?type=EXPENSE&email=backend@example.com
- Example
```
https://asset-hexa-server.vercel.app/catPi?type=EXPENSE&email=backend@example.com
```
- API GET For Pie chart separated by Account type https://asset-hexa-server.vercel.app
```
 https://asset-hexa-server.vercel.app/accountPi?email=backend@example.com
```
