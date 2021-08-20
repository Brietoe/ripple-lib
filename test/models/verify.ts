import { ValidationError } from 'xrpl-local/common/errors'
import { verify } from './../../src/models/transactions/verify'
import { assert } from 'chai'

/**
 * Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('Global Transaction Verification', () => {

    it (`verifies valid AccountDelete`, () => {
        const validAccountDelete = {
            TransactionType: "AccountDelete",
            Account: "rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm",
            Destination: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
            DestinationTag: 13,
            Fee: "5000000",
            Sequence: 2470665,
            Flags: 2147483648
        } as any
        
        assert.doesNotThrow(() => verify(validAccountDelete))
    })

    it (`throws w/ missing Destination`, () => {
        const invalidDestination = {
            TransactionType: "AccountDelete",
            Account: "rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm",
            Fee: "5000000",
            Sequence: 2470665,
            Flags: 2147483648
        } as any

        assert.throws(
            () => verify(invalidDestination),
            ValidationError,
            "AccountDelete: missing field Destination"
        )
    })

    it (`verifies valid AccountSet`, () => {
        const account = {
            TransactionType : "AccountSet",
            Account : "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Fee : "12",
            Sequence : 5,
            Domain : "6578616D706C652E636F6D",
            SetFlag : 5,
            MessageKey : "03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB"
        } as any
        assert.doesNotThrow(() => verify(account))

        it (`throws w/ invalid SetFlag (out of range)`, () => {
            account.SetFlag = 12
    
            assert.throws(
                () => verify(account),
                ValidationError,
                "AccountSet: invalid SetFlag"
            )
        })
    })

    it (`verifies valid CheckCancel`, () => {
        const validCheckCancel = {
            Account : "rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo",
            TransactionType : "CheckCancel",
            CheckID : "49647F0D748DC3FE26BDACBC57F251AADEFFF391403EC9BF87C97F67E9977FB0"
        } as any

        assert.doesNotThrow(() => verify(validCheckCancel))
    })

    it (`verifies valid CheckCash`, () => {
        const validCheckCash = {
            Account : "rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy",
            TransactionType : "CheckCash",
            Amount : "100000000",
            CheckID : "838766BA2B995C00744175F69A1B11E32C3DBC40E64801A4056FCBD657F57334",
            Fee : "12"
        } as any
        
        assert.doesNotThrow(() => verify(validCheckCash))
    })

    it (`verifies valid CheckCreate`, () => {
        const validCheck = {
            TransactionType : "CheckCreate",
            Account : "rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo",
            Destination : "rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy",
            SendMax : "100000000",
            Expiration : 570113521,
            InvoiceID : "6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B",
            DestinationTag : 1,
            Fee : "12"
          } as any
        
        assert.doesNotThrow(() => verify(validCheck))
    })

    let depositPreauth
    beforeEach(() => {
        depositPreauth = {
            TransactionType: 'DepositPreauth',
            Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
        } as any
    })

    it ('verifies valid DepositPreauth when only Authorize is provided', () => {
        depositPreauth.Authorize = 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW'
        assert.doesNotThrow(() => verify(depositPreauth))
    })

    it ('throws when neither Authorize nor Unauthorize are provided', () => {
        assert.throws(
            () => verify(depositPreauth),
            ValidationError,
            'DepositPreauth: must provide either Authorize or Unauthorize field'
        )
    })

    let cancel
    beforeEach(() => {
        cancel = {
            TransactionType: "EscrowCancel",
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Owner: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            OfferSequence: 7,
        }
    })

    it (`Valid EscrowCancel`, () => {
        assert.doesNotThrow(() => verify(cancel))
    })

    it (`Invalid EscrowCancel missing owner`, () => {
       delete cancel.Owner

        assert.throws(
            () => verify(cancel),
            ValidationError,
            'EscrowCancel: missing Owner'
        )
    })

    let escrow
    beforeEach(() => {
        escrow = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowCreate",
            Amount: "10000",
            Destination: "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            CancelAfter: 533257958,
            FinishAfter: 533171558,
            Condition: "A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100",
            DestinationTag: 23480,
            SourceTag: 11747
        }
    })
    
    it (`verifies valid EscrowCreate`, () => {        
        assert.doesNotThrow(() => verify(escrow))
    })

    beforeEach(() => {
        escrow =  {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowFinish",
            Owner: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            OfferSequence: 7,
            Condition: "A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100",
            Fulfillment: "A0028000"
        }
    })
    it (`verifies valid EscrowFinish`, () => {                    
        assert.doesNotThrow(() => verify(escrow))
    })

     let offer
     beforeEach(() => {
        offer = {
            TransactionType: "OfferCancel",
            Account: "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
            Fee: "12",
            Flags: 0,
            LastLedgerSequence: 7108629,
            OfferSequence: 6,
            Sequence: 7
        } as any
    })
 
     it (`verifies valid OfferCancel`, () => {        
         assert.doesNotThrow(() => verify(offer))        
     })

     beforeEach(() => {
        offer = {
            Account: "r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W",
            Fee: "10",
            Flags: 0,
            LastLedgerSequence: 65453019,
            Sequence: 40949322,
            SigningPubKey: "03C48299E57F5AE7C2BE1391B581D313F1967EA2301628C07AC412092FDC15BA22",
            Expiration: 10,
            OfferSequence: 12,
            TakerGets: {
                currency: "DSH",
                issuer: "rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX",
                value: "43.11584856965009"
            },
            TakerPays: "12928290425",
            TransactionType: "OfferCreate",
            TxnSignature: "3045022100D874CDDD6BB24ED66E83B1D3574D3ECAC753A78F26DB7EBA89EAB8E7D72B95F802207C8CCD6CEA64E4AE2014E59EE9654E02CA8F03FE7FCE0539E958EAE182234D91",
        } as any
    })

    it (`verifies valid OfferCreate`, () => {
        assert.doesNotThrow(() => verify(offer))
    })

    let channel
    beforeEach(() => {
        channel = 
        {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelClaim",
            "Channel": "C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198",
            "Balance": "1000000",
            "Amount": "1000000",
            "Signature": "30440220718D264EF05CAED7C781FF6DE298DCAC68D002562C9BF3A07C1E721B420C0DAB02203A5A4779EF4D2CCC7BC3EF886676D803A9981B928D3B8ACA483B80ECA3CD7B9B",
            "PublicKey": "32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A"
        } as any
    })

    it (`verifies valid PaymentChannelClaim`, () => {
        assert.doesNotThrow(() => verify(channel))
    })

    beforeEach(() => {
        channel = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelCreate",
            "Amount": "10000",
            "Destination": "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            "SettleDelay": 86400,
            "PublicKey": "32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A",
            "CancelAfter": 533171558,
            "DestinationTag": 23480,
            "SourceTag": 11747
        }        
    })
    
    it (`verifies valid PaymentChannelCreate`, () => {        
        assert.doesNotThrow(() => verify(channel))
    })
    
    beforeEach(() => {
        channel = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelFund",
            "Channel": "C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198",
            "Amount": "200000",
            "Expiration": 543171558
        }
    })
    
    it (`verifies valid PaymentChannelFund`, () => {
        assert.doesNotThrow(() => verify(channel))
    })

    it (`verifies valid PaymentChannelFund w/o optional`, () => {
        delete channel.Expiration
        
        assert.doesNotThrow(() => verify(channel))
    })

    it (`throws w/ missing Amount`, () => {
        delete channel.Amount

        assert.throws(
            () => verify(channel),
            ValidationError,
            "PaymentChannelFund: missing Amount"
        )
    })

    let paymentTransaction
    beforeEach(() => {
        paymentTransaction = {
            TransactionType: "Payment",
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Destination: "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
            Amount: {
                currency: "USD",
                value: "1",
               issuer: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn"
            },
            Fee: "12",
            Flags: 2147483648,
            Sequence: 2,
          } as any
    })

    it (`verifies valid PaymentTransaction`, () => {
        assert.doesNotThrow(() => verify(paymentTransaction))
    })

    it (`throws when Amount is missing`, () => {
        delete paymentTransaction.Amount
        assert.throws(
            () => verify(paymentTransaction),
            ValidationError,
            'PaymentTransaction: missing field Amount'
        )
    })

    let account
    beforeEach(() => {
        account = {
            TransactionType : "SetRegularKey",
            Account : "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Fee : "12",
            Flags : 0,
            RegularKey : "rAR8rR8sUkBoCZFawhkWzY4Y5YoyuznwD"
        } as any
    })

    it (`verifies valid SetRegularKey`, () => {
        assert.doesNotThrow(() => verify(account))
    })

    let SignerListSetTx
    beforeEach(() => {
        SignerListSetTx = {
            Flags: 0,
            TransactionType: "SignerListSet",
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Fee: "12",
            SignerQuorum: 3,
            SignerEntries: [
                {
                    SignerEntry: {
                        Account: "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
                        SignerWeight: 2
                    }
                },
                {
                    SignerEntry: {
                        Account: "rUpy3eEg8rqjqfUoLeBnZkscbKbFsKXC3v",
                        SignerWeight: 1
                    }
                },
                {
                    SignerEntry: {
                        Account: "raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n",
                        SignerWeight: 1
                    }
                }
            ]
        } as any
    })
    
    it (`verifies valid SignerListSet`, () => {
        assert.doesNotThrow(() => verify(SignerListSetTx))
    })

    it ('verifies valid TicketCreate', () => {
        const ticketCreate = {
            TransactionType: 'TicketCreate',
            Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
            TicketCount: 150,
        } as any
        assert.doesNotThrow(() => verify(ticketCreate))
    })

    it ('verifies valid TrustSet', () => {
        const tx = {
            TransactionType: 'TrustSet',
            Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
            LimitAmount: {
                currency: 'XRP',
                issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
                value: '4329.23'
            },
            QualityIn: 1234,
            QualityOut: 4321,
        } as any

        assert.doesNotThrow(() => verify(tx))
    })

})