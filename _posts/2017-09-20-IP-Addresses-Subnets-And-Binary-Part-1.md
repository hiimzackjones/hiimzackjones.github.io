---
layout: post
title:  
date: 2017-09-20 2:30:00 -0400
categories: Networking
---

## Binary, Ip addresses, Subnet masking.

Okay so. I'm going to make some notes on this. Because this the most fundamental thing you need to know to do ... anything really. so. I'm not going to waste time. Leh do it. Heads up, this page is perf for noobs. If you've got binary down and just want to learn subnets [head to part 2](fixThislink)


<iframe src="https://giphy.com/embed/YQitE4YNQNahy" width="480" height="270" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>

---

### 1. Decimal numbers are confusing. Binary makes this way easier.

This is an ip address example


<code>192.168.1.1 </code>


This is a subnet mask example


<code>255.255.255.0 </code>

These are written in human readable numbers (Decimal for the technical), most humans prefer it this way. Be a better human by figuring this mess out in the right way. *Also known as binary.*

At some point you'll need to be able to do this stuffs in Decimal notation. But until you understand what that even is, **you've got to understand it on a binary level.** The decimal notation like I showed you above is literally only that way because writing binary takes forever and our brains don't quickly compute it. That is the only reason. So for now forget it.

 This is the IP in Binary, the language of computers.

 <code> 11000000.10101000.00000001.0000001 </code>

This is the subnet in binary.  

 <code> 11111111.11111111.11111111.00000000 </code>

---

### 2. What does the subnet actually mean?
Cool. Now let's do a thing that's going to make subnet masking super fricking easy.

I repeat, **this is the part that isn't always shown to noobs but makes you less noob in seconds if you get blessed enough to see it**

To setup this magic trick just imagine it stacked, subnet mask on top of the IP. I'll make it easier.


```
11111111.11111111.11111111.00000000  
11000000.10101000.00000001.00000001 
```


Now here is the magic trick. Write the same thing, but put an extra space or 2 between where the subnet changes from 1s to 0s. *Like so friends.*


```
11111111.11111111.11111111.  00000000 
11000000.10101000.00000001.  00000001
```

**Okay. Congrats. GG. Pat yourself on the back because...***

 You just took the subnet and figured out something really important about the IP address.

The numbers on the left are talking about the network, and the numbers on the right are talking about the host. Technically you've answered these questions  

- What does the subnet mask do regarding the IP address
- what part of the IP address talks about the network based on the subnet
- What part about the IP address talks about the hosts (Clients, computers, etc) on that network based on the subnet

**E A S Y.**


<iframe src="https://giphy.com/embed/ZvLUtG6BZkBi0" width="480" height="366" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>
---

### 3. Time to learn that binary real quick like

*I say real quick like because this is going to take a hot minute. My bad.*

So I want to take your new subnetting knowledge to the next level. But you have to learn more about binary first. I wanted to give you that taste of *"subnetting is really dang easy"* as a piece of encouragement.

**Okay binary... here we go.**

If I were to say to increment in decimal starting from 1, and increment 8 numbers. It would be so easy for you, because you think in decimal. But doing in binary is different. So despite this next section seeming trivial, do it anyway. And if you don't know what I'm talking about. here.

```
1
2
3
4
5
6
7
8
9
```
That was incrementing starting at 1 going up 8 numbers. Now I'm going to do the same thing in binary.

```
00000001
00000010
00000011
00000100
00000101
00000111
00001000
```

Now I like to show peeps that before we talk about the power of 2 mess that everyone opens up with. Because it's easy to see the pattern. You're basically doing that thing we do in decimal where a value gets pushed over to the left when it gets to a certain point. lol. You have no idea what I'm talking about when I say that. Let me illustrate.

```
08
09
10
```
**Notice as I incremented the number on the right went up, until it got filled up, then it went back to 0 and the number on the left went up a digit.** Cool. This is how we see it and it seems easier. But it's only because we have 10 fingers guys. That's the only reason.

Imagine for some reason the characters for 2-9 didn't exist. The only characters we could write would be 1 and 0. okay Let's count again in binary but only use the 1 and 0 keys.

note: I'm going to use less bits to make this easier. Don't worry about what that means  
```
0001
```  
Okay. I can't do  
```  
0002
```  
Because that isn't an option. The only thing that the right most digit can be is 1 or 0. And we know 1 is more than 0. So  
```  
0000
```  
is obviously 0 and  
```  
0001  
```  
is 1. But to get to 2, **you have to do the same thing we did in decimal when we when from 9 to 10. Move over to the next digit and bring the digit we are filling up back down to 0.**  
```  
0010
```  
Ha. I can feel you getting it. Let's keep going. I want to increment a couple more times (2 more times guys)  

```
0010  
0011  
0100  
```  
Okay you get it. Once the stuff on the right gets filled up it gets moved over a digit. Just like 99 to 100. And then it goes 101 and so on so forth until 999 moves to 1000. But again. Just 0 to 1 before we move the digit.  

So what does that mean about the values? Let's put some binary up and let's contemplate a bit.

```   
000 - is 0  
```

```   
001 - is 1  
```

```   
010 - is 2  
```

```   
011 - is 3  
```

```   
100 - is 4  
```

*So. This next part might seem too abstract at first to really take in, but just work with me here.*

We move the counter over instead of making a 1 into a 2. And for that, every time we move left a digit, we are doubling. Because 2 is twice as much as 1. You can see this when we go from  

```   
010 - 2
011 - 3
100 - 4
```  
Look at just 2 and 4.  

```
010 - 2
100 - 4
```  

Yep. It doubles too. well. Let's just increment from 0 to the number 8 and note where there is only one bit as a 1.  

```
00000001 - 1
00000010 - 2
00000011
00000100 - 4
00000101
00000111
00001000 - 8
```  

*Okay. So this is the correct place to tell you that if you were to make a note on the value of each bit, you'll notice it's in the power of 2s. Because each time you increment into another digit to the left, you're doubling.*

Look. (This graph may not work)

```
|4  |2  |1  |  
|---|---|---|  
|0  |0  |1  |    0*4 + 0*2 + 1*1 = 1   
|0  |1  |0  |    0*4 + 1*2 + 0*1 = 2   
|0  |1  |1  |    0*4 + 1*2 + 1*1 = 3   
|1  |0  |0  |    1*4 + 0*2 + 0*1 = 4  

```


Let's look at this binary number we saw earlier. (This graph may not work)

```

|128|64 |32 |16 |8  |4  |2  |1  |
|---|---|---|---|---|---|---|---|
|1  |0  |1  |0  |1  |0  |0  |0  |  

```

1\*128 + 0\*64 + 1\*32 + 1\*32 + 0\*16 + 1\*8 + 0\*4 + 0\*2 + 0\*1 = 168



Well. That makes sense right? To review. The bits double from right to left. The third bit from the right has the value of 4, the one directly to the left of it has a value of 8. So even if you can't remember those numbers, you should be able to start with one and double over and over until you get all the values from right to left.  

*NOTE. If it doubles from right to left, it gets cut in half coming from the left going to the right. (you'll see this when you do subnetting.)*  

---
<iframe src="https://giphy.com/embed/l3q2Ph0I1osaagoQE" width="480" height="270" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>

### Okay take a breather. We are going to get back into subnet masking, but for now, let this settle in.

Go through this, if you have questions find me on twitter [@hiimzackjones](http://twitter.com/hiimzackjones) or email me at [ztj20@email.vccs.edu](mailto:ztj20@email.vccs.edu). Soon there will be more to this post. If you've read this far down, then thanks. Means a lot.

Cheers,

Zack
