--- 
layout: post 
title: 
date: 2017-09-26 11:30:00 -0400 
categories: Networking 
---

## Binary, Ip addresses, Subnet masking (Part 2) 


<iframe src="https://giphy.com/embed/VNhrzGZDa8mZy" width="480" height="360" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>

Ayeeee. Okay so you've read through part 1 and you have a good
understanding of binary, IP addresses and a little about subnets. If you
haven't read it yet, go back and read it. If you have a good grasp on
binary and IP addresses you should be able to make it through this. Here
is a *quick* overview.

[Or you can skip the overview and get straight to the meats by clicking here.](#skip1) 
<iframe src="https://giphy.com/embed/cW55zyF7dJAf6" width="120" height="65" frameBorder="0" class="giphy-embed"></iframe>



---


### Binary

Binary is 1s and 0s where the values are in the power of 2 in succession
from right to left.

ie.

```
 Value - 128  64  32  16  8  4  2  1 
  bits -   0   1   1   0  1  1  0  1 
  ```

The values of the bits from *right to left* double starting at 1. The
values of the bits from *left to right* half starting at 128. (This will
come in handy in a bit, read this line 2 or 3 times to remember it) In
other words the above binary 01101101 equals 109. The 1s mean to take
the number that is above it and add it. Simple.

This is what **incrementing binary** looks like.

``` 
00100100 
00100101 
00100110 
00100111 
00101000 
```

---


### IP Addresses

Are made up of 4 octets. Each octet is an 8 bit binary number
represented in decimal.

ie. <code> 192.168.1.1</code> or <code>
11000000.10101000.00000001.00000001 </code>

The 24 bits that make up an IP address are divided into two section.
Thus the IP address talks about two things. 
- What network the device with the IP is in 
- What host it is in the network.

The division in the IP address between network and host bits can be
'slid' to divide it however is needed for that network.


**And that is where we left off.**

---


<a name="skip1"></a>


## The ever complicated and intimidating Subnet Masking


The subnet is a 4 octet number that looks similar to the IP. It tells
where the divison happens in the IP address, setting one side of bits to
represent the network, and the other side represent the host.

Example.

```

|       | Decimal         | Binary                              |
|-------|-----------------|-------------------------------------| 
|SUBNET |255.255.255.000  | 11111111.11111111.11111111.00000000 |
|-------|-----------------|-------------------------------------| 
|IP ADDR|192.168.001.001  | 11000000.10101000.00000001.00000001 |
|-------|-----------------|-------------------------------------|
``` 
If you're looking at that and you're real confused. [Go back to Part 1](https://hiimzackjones.github.io/networking/2017/09/20/IP-Addresses-Subnets-And-Binary-Part-1.html)

To find out where the divison happens. split the bits where the subnet
1s and 0s meet. Like so:


```
|       |          Network             |  Host    |
|-------|------------------------------|----------|   
|SUBNET | 11111111.11111111.11111111.  | 00000000 |
|-------|------------------------------|----------| 
|IP ADDR| 11000000.10101000.00000001.  | 00000001 |
|-------|------------------------------|----------|

```


Okay. Now that we've blazed through that. Let's take a second. Lets use
the above example and do something simple.

Let's say you have 1 host on that network. Let's say it's IP address is
192.168.1.1 If we wanted to add another host, which part of the IP
address would we increment? We know that the network side shouldn't even
be touched because it's for the network. And changing the network
would... change the network. Right?! Yeah cool so. Let's only look at
the host part of the IP address. AKA the last 8 bits. AKA the bits that
line up with the bits in the subnet marked as 0.

So. 192.168.1  is network and .1 is host. So we are looking at the .1.

In binary it's <code>00000001</code> right? So if we were to add hosts
we would only increment that number. Which you should know how to do by
now yuh? Let's just do a few below.

``` 
00000001   ---   1 
00000010   ---   2 
00000011   ---   3 
``` 

That is 1, 2, and 3. Cool. Simple.

How do we add networks? (Note that I'm saying add and not divide or
subnet.)

We increment the side that counts for networks. sooooo.

```

11000000.10101000.00000001.   ---   192.168.1.
11000000.10101000.00000010.   ---   192.168.2.
11000000.10101000.00000011.   ---   192.168.3.

Skipping down a little

11000000.10101000.11111111.   ---   192.168.255.
11000000.10101001.00000000.   ---   192.169.000.
11000000.10101001.00000001.   ---   192.169.001.
11000000.10101001.00000010.   ---   192.169.002.

```

I threw an extra little tasty in there by filling up the right
octet. We just kept it moving. Like a clock. When you get to 59 minutes
and 59 seconds you move up an hour right? See this isn't hard stuff.

---

### The hard part. 

Lol.

So what happens when we move that division over in the subnet? What
happens if we move it over one spot to the right?

```
|       |          Network             | Host    |
|-------|------------------------------|---------| 
|subnet | 11111111.11111111.11111111.1 | 0000000 |
|-------|------------------------------|---------| 
|IP ADDR| 11000000.10101000.00000001.0 | 0000001 |
|-------|------------------------------|---------|

```

Notice that the octet is sitting on that split. Here
is the thing. When going from binary to decimal, making it easier to
read for us, we still look at the 8 bits as one chunk. So the bit that
is on the network side, is still in the same octet as it's 7 host
buddies. This does some funky stuff with the decimal notation. 

Let's do this. Let's do the thing where we increment the network, or in
this case the subnetwork.


```

11000000.10101000.00000001.0   ---   192.168.1.0
11000000.10101000.00000001.1   ---   192.168.1.128

``` 

That's it. Those two IP addresses above are the networks. Yes it's 4
octets. But we still have 7 bits (host bits) uncounted for. What we have
done here, is borrowed a bit from the host side and gave it to the
network side, **dividing the network in half.**

I can't say that enough. Borrowing a bit divides the network in half.

For the visual folks.

![A 255.255.255.0 network](/assets/img/subnet1.png)  
This is a network. Like 192.168.1.0 with a subnet mask of 255.255.255.0
(no borrowing of bits yet)

The network has a block size of 255. Aka it has 255 numbers available.
253 of those will be for hosts.

Now let's borrow a bit and then what happens to the network?

![A 255.255.255.128 network](/assets/img/subnet2.png)  

Yep. That borrowed bit splits it in half. Giving you 2 networks with a
block size of 128. Each network will have 126 spots for hosts.

Soooo. That means the subnet mask is  
 
<code>11111111.11111111.11111111.10000000   --- 255.255.255.128</code>  
 
And the two networks are  
 
<code> Network 1 - 192.168.1.000 </code>  
 
and  
 
<code> Network 2 - 192.168.1.128 </code>  


Ya dig?

Why not borrow another bit?

![A 255.255.255.192 network](/assets/img/subnet3.png)  


Now this cuts the network in half and then cuts those two halves in half. It's 2 bits
borrowed so the subnet is  
   
<code>11111111.11111111.11111111.11000000  ---   255.255.255.224 </code>  
     
and you have 4 networks with block sizes
of 64. This means 62 IP addresses available for hosts.

The 4 networks are 

<code>Network 1   ---   192.168.1.000</code>  
<code>Network 2   ---   192.168.1.064</code>  
<code>Network 3   ---   192.168.1.128</code>   
<code>Network 4   ---   192.168.1.192</code>  

Boom. That's it guys.

---

## Learn by doing. 

Essentially when you're taking the Cisco tests, they are going to ask you loaded questions and you have to
work backwards to figure it out. I decided to give you a few example questions. Leh do it. 


### 1. 

#### You're working a company that has a network - 210.10.50.0 255.255.255.0 and the boss needs it to be split up for his 3 divisions. He hires you to set up the three networks. Go.


Okay I'll help with this one to get you started. 

How many bits do you need to borrow to get 3 subnets? if you borrow 1 bit, you've split the network
into 2 subnets - not enough. If you borrow 2 bits, you've split the network into 4 subnets - more than enough.   

So the subnet is going to go from 255.255.255.0 to Whatever the subnet
will be if you borrow 2 bits.

*A trick for adding up borrowed bits:*   
So you know that the counters for binary look like this.  
<code> 128 64 32 16 8 4 2 1 </code>  
If you take those numbers and add from the left like this  
<code> 128 192 224 240 248 252 254 255 </code>  

Then just jot these down somewhere for reference, or memorize the first few, These are all the available
numbers for the subnet. Period. And in this case, we borrowed two, so just look
at the second number. That makes the subnet 
<code> 255.255.255.192 </code>

Sweet action senior. Now you can look up at the counter above to see what the block size is. Second number over is 64. So you've
now got the subnet and a way to find the network names. The first network will of course be .0 and the next one will be a block size above it. So just keep adding the block size. 


``` 
network 1   ---   210.10.50.0 
network 2   ---   210.10.50.64 
network 3   ---   210.10.50.128 
network 4   ---   210.10.50.192 
```
Boom. You did it.

### 2. 
#### You have an IP address of 194.200.10.200/28. Answer the following. 
- In what network is this IP address? 
- What is that network's Broadcast ID?
- Subnet mask?
- Block Size?
- Next available network?
- Next available Host IP?

I won't work through this one quite yet. But I will give you a hint. The /27 is something we haven't talked about. It's just the number of network bits in the IP address. Or the number of 1s in the subnet mask. 
so this is what the subnet would be in binary. 
<code> 11111111.11111111.11111111.11110000 </code>
Go to town. I'll post solutions later. 

### 3. 
#### You have an IP address of 10.50.76.187/16 Answer the following.
- In what network is this IP address? 
- What is that network's Broadcast ID?
- Subnet mask?
- Block Size?
- Next available network?
- Next available Host IP?
- Is the IP address 10.50.76.255 a broadcast ID? Why or why not?

### 4.
#### The network 80.168.23.0 Needs to be split into 20 subnetworks. 
- What subnet mask would you use to split the network in the needed subnets?
- What is the blocksize of each network? 
- From that block size, how many IPs are available to give to hosts? 
- Which network would 80.163.23.115 be in? 

---
---

## Fin.

<iframe src="https://giphy.com/embed/VVxFf6TGdubXG" width="398" height="480" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>

Okay that's it for Subnetting right now. There is some more to go. We haven't talked about supernetting and the Classes. This post has mainly be to help get through the basic math. The rest will come. Thanks! 
If you have questions or want me to write anything in particular hit me up. [@hiimzackjones](http://twitter.com/hiimzackjones) or email me at [ztj20@email.vccs.edu](mailto:ztj20@email.vccs.edu).  

Cheers,

Zack


