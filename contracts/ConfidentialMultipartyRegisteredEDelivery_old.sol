pragma solidity ^0.4.25;

// FUnciona el modul exponencial, pero el problema es... com li pas parametres de mes de 256 bits? w, etc...


// Factory contract for Confidential Multiparty Registered eDelivery
contract ConfidentialMultipartyRegisteredEDeliveryFactory {
    mapping(address => address[]) public senderDeliveries;
    mapping(address => address[]) public receiverDeliveries;
    address[] public deliveries;

    function createDelivery(address[] _receivers, uint _m1, uint _m2, uint _ya, uint _g, uint _p, uint _term1, uint _term2) public payable {
        address newDelivery = (new ConfidentialMultipartyRegisteredEDelivery)
            .value(msg.value)(msg.sender, _receivers, _m1, _m2, _ya, _g, _p, _term1, _term2);
        deliveries.push(newDelivery);
        senderDeliveries[msg.sender].push(newDelivery);
        for (uint i = 0; i<_receivers.length; i++) {
            receiverDeliveries[_receivers[i]].push(newDelivery);
        }
    }

    function getSenderDeliveries(address _sender) public view returns (address[]) {
        return senderDeliveries[_sender];
    }

    function getSenderDeliveriesCount(address _sender) public view returns (uint) {
        return senderDeliveries[_sender].length;
    }

    function getReceiverDeliveries(address _receiver) public view returns (address[]) {
        return receiverDeliveries[_receiver];
    }

    function getReceiverDeliveriesCount(address _receiver) public view returns (uint) {
        return receiverDeliveries[_receiver].length;
    }

    function getDeliveries() public view returns (address[]) {
        return deliveries;
    }

    function getDeliveriesCount() public view returns (uint) {
        return deliveries.length;
    }
}

// Confidential Multiparty Registered eDelivery
contract ConfidentialMultipartyRegisteredEDelivery {
    // Possible states
    enum State {notexists, created, cancelled, accepted, finished, rejected }
    
    struct ReceiverState{
        uint z1;
        uint z2;
        uint yb;
        uint c;
        uint w;
        State state;
    }
    // Parties involved
    address public sender;
    address[] public receivers;
    mapping (address => ReceiverState) public receiversState;
    uint acceptedReceivers;

    // Message
    uint public m1;
    uint public m2;
    uint public ya;
    uint public g;
    uint public p;
    // Time limit (in seconds)
    // See units: http://solidity.readthedocs.io/en/develop/units-and-global-variables.html?highlight=timestamp#time-units
    uint public term1; 
    uint public term2; 
    // Start time
    uint public start; 

    // Constructor funcion to create the delivery
    constructor (address _sender, address[] _receivers, uint _m1, uint _m2, uint _ya, uint _g, uint _p, uint _term1, uint _term2) public payable {
        // Requires that the sender send a deposit of minimum 1 wei (>0 wei)
        require(msg.value>0, "Sender has to send a deposit of minimun 1 wei"); 
        require(_term1 < _term2, "Timeout term2 must be greater than _term1");
        sender = _sender;
        receivers = _receivers;
        // We set the state of every receiver to 'created'
        for (uint i = 0; i<receivers.length; i++) {
            receiversState[receivers[i]].state = State.created;
        }
        acceptedReceivers = 0;
        m1 = _m1;
        m2 = _m2;
        ya = _ya;
        g = _g;
        p = _p;
        start = now; // now = block.timestamp
        term1 = _term1; // timeout term1, in seconds
        term2 = _term2; // timeout term2, in seconds
    }

    // accept() lets receivers accept the delivery
    function accept(uint _z1, uint _z2, uint _yb, uint _c) public {
        require(now < start+term1, "The timeout term1 has been reached");
        require(receiversState[msg.sender].state==State.created, "Only receivers with 'created' state can accept");

        acceptedReceivers = acceptedReceivers+1;
        receiversState[msg.sender].z1 = _z1;
        receiversState[msg.sender].z2 = _z2;
        receiversState[msg.sender].yb = _yb;
        receiversState[msg.sender].c = _c;
        receiversState[msg.sender].state = State.accepted;        
    }

    function expmod3(uint256 base, uint256 exp, uint256 mod) internal pure returns (uint256 result)  {
        result = 1;
        for (uint count = 1; count <= exp; (count = (count*2)-1)) {
            if (exp & (count+1) != 0)
                result = mulmod(result, base, mod);
            base = mulmod(base, base, mod);
        }
    }

    function expmod(uint256 _b, uint256 _e, uint256 _m) internal returns (uint256 result) {
        assembly {
            // Free memory pointer
            let pointer := mload(0x40)

            // Define leenth of base, exponent and modulus. 0x20 == 32 bytes
            mstore(pointer, 0x20)
            mstore(add(pointer, 0x20), 0x20)
            mstore(add(pointer, 0x40), 0x20)

            // Define variables base, exponent and modulus
            mstore(add(pointer, 0x60), _b)
            mstore(add(pointer, 0x80), _e)
            mstore(add(pointer, 0xa0), _m)

            // Store the result
            let value := mload(0xc0)

            // Call the preppompiled contract 0x05 = bigModExp
            if iszero(call(not(0), 0x05, 0, pointer, 0xc0, value, 0x20)) {
                revert(0, 0)
            }

            result := mload(value)
        }
    }

    function expmod2(uint256 _b, uint256 _e, uint256 _m) internal returns (uint256 result) {
        assembly {
            // Free memory pointer
            let pointer := mload(0x80)

            // Define leenth of base, exponent and modulus. 0x20 == 32 bytes
            mstore(pointer, 0x40)
            mstore(add(pointer, 0x40), 0x40)
            mstore(add(pointer, 0x80), 0x40)

            // Define variables base, exponent and modulus
            mstore(add(pointer, 0xc0), _b)
            mstore(add(pointer, 0x100), _e)
            mstore(add(pointer, 0x140), _m)

            // Store the result
            let value := mload(0x180)

            // Call the preppompiled contract 0x05 = bigModExp
            if iszero(call(not(0), 0x05, 0, pointer, 0x180, value, 0x40)) {
                revert(0, 0)
            }

            result := mload(value)
        }
    }

    // https://gist.github.com/stonecoldpat/2440c50d6b666c7649afb6ad424cea25

    /// @dev Modular exponentiation, b^e % m
    /// Basically the same as can be found here:
    /// https://github.com/ethereum/serpent/blob/develop/examples/ecc/modexp.se
    /// @param b The base.
    /// @param e The exponent.
    /// @param m The modulus.
    /// @return x such that x = b**e (mod m)
    function expmod1(uint b, uint e, uint m) internal pure returns (uint r) {
        if (b == 0)
            return 0;
        if (e == 0)
            return 1;
       require(m != 0);
        r = 1;
        uint bit = 2 ** 255;
        bit = bit;
        assembly {
                for { } not(eq(bit, 0)) { } {
                r := mulmod(mulmod(r, r, m), exp(b, iszero(iszero(and(e, bit)))), m)
                r := mulmod(mulmod(r, r, m), exp(b, iszero(iszero(and(e, div(bit, 2))))), m)
                r := mulmod(mulmod(r, r, m), exp(b, iszero(iszero(and(e, div(bit, 4))))), m)
                r := mulmod(mulmod(r, r, m), exp(b, iszero(iszero(and(e, div(bit, 8))))), m)
                bit := div(bit, 16)
                }
        }
    }

    function aaa(address _receiver, uint _w, uint _r) public returns(uint) {
        return expmod(g, _w, p);
    }

    function bbb(address _receiver, uint _w, uint _r) public returns(uint) {
        return mulmod( expmod(g, _r, p) , expmod(receiversState[_receiver].yb, receiversState[_receiver].c, p), p);
    }

    // finish() lets sender finish the delivery sending the message
    function finish(address _receiver, uint _w, uint _r) public {
        require((now >= start+term1) || (acceptedReceivers>=receivers.length), 
            "The timeout term1 has not been reached and not all receivers have been accepted the delivery");
        require (msg.sender==sender, "Only sender of the delivery can finish");

        // g^w mod p
        uint aaa = expmod(g, _w, p);
        // ((g^r mod p)·(yb^c mod p)) mod p
        uint bbb = mulmod( expmod(g, _r, p) , expmod(receiversState[_receiver].yb, receiversState[_receiver].c, p), p);

//        require (aaa==bbb, "AAA==BBB");

        
        //Kkkkkkkkkk require (messageHash==keccak256(_message), "Message not valid (different hash)");


        sender.transfer(this.balance); // Sender receives the refund of the deposit
        // We set the state of every receiver with 'accepted' state to 'finished'
        for (uint i = 0; i<receivers.length; i++) {
            
            // TODO: Falta assignar un w per cada B'
            receiversState[receivers[i]].w = _w;

            if (receiversState[receivers[i]].state == State.accepted) {
                receiversState[receivers[i]].state = State.finished;    
            } else if (receiversState[receivers[i]].state == State.created) {
                receiversState[receivers[i]].state = State.rejected;    
            }
        }
    }

    // cancel() lets receivers cancel the delivery
    function cancel() public {
        require(now >= start+term2, "The timeout term2 has not been reached");
        require(receiversState[msg.sender].state==State.accepted, "Only receivers with 'accepted' state can cancel");

        receiversState[msg.sender].state = State.cancelled;
    }

    // getState(address) returns the state of a receiver in an string format
    function getState(address _receiver) public view returns (string) {
        if (receiversState[_receiver].state==State.notexists) {
            return "not exists";
        } else if (receiversState[_receiver].state==State.created) {
            return "created";
        } else if (receiversState[_receiver].state==State.cancelled) {
            return "cancelled";
        } else if (receiversState[_receiver].state==State.accepted) {
            return "accepted";
        } else if (receiversState[_receiver].state==State.finished) {
            return "finished";
        } else if (receiversState[_receiver].state==State.rejected) {
            return "rejected";
        } 
    }
}