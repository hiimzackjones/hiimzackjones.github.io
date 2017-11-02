--- 
layout: post 
title: 
date: 2017-10-22 19:42:00 -0400 
categories: Cisco 
---

## The Cisco IOS Routing Table

The routing table in IOS shows the different routes or additional neighboring networks that an IP packet may need to go. It also lists the hardware port that a packet will need to be sent. It will consist of directly connected routes as well as routes that have been advertised by adjacent routers. Knowing where networks are helps the router know what interface and port to shoot the little fella to. 

### Look at it. 
![Routing Table Pictures](/assets/img/CiscoRoutingTable/1.png)  
It looks scary. Unlike the Netstat -r command on windows, it's not organized with columns or anything so it may be sort of hard to understand unless you know what you're looking for. Huuzah for blog posts and break it down for you. 

### Start on line 1. 
![Routing Table Pictures](/assets/img/CiscoRoutingTable/2.png)
This line starts off with an IP address for a network. 10.0.0.0/8. It tells you how many subnets it has and it's masks number. And that's all. This is all you need to know to take your first step to routing a packet. "Yeah this is the network I need to send it to, now how do I do it?" Thus the next lines. 

### The Next Lines. 
![Routing Table Pictures](/assets/img/CiscoRoutingTable/3.png)
These next two sections are the two subnets it mentions above. It shows both because both they are broadcasted to it via EIGRP. We know this because it has a prefix of 'D'. These advertisements are coming from the interface 209.165.200.226 on some adjacent router that has been connected on Interface Serial 0/0/0. Easy. No matter what subnet your IP packet falls into, It will go through Serial 0/0/0 into the next router via 209.165.200.226 and then that router handles the rest. Bye packets.   

### Other connected routes.
![Routing Table Pictures](/assets/img/CiscoRoutingTable/4.png)
There are three other routes this router knows about. These three routes are organized in the same way as the first, but the information is slightly different because they are directly connected. The three examples are also only connected to 1 subnet of each network(to be expected) but no matter what the subnet is, you'll most likely be sending it their way and letting that subnet's router handle where it goes next with it's own routing table. 

### The Network IDs (line 1)
![Routing Table Pictures](/assets/img/CiscoRoutingTable/5.png)
The first line can be identified easily. It always say something about having x amount of subnets and x amount of masks. The IP before that line is always the over arching network ID without regard of subnets. 

## More specifically, these subnets... (line 2)
![Routing Table Pictures](/assets/img/CiscoRoutingTable/6.png)
The second line is the Network ID including the Subnet. It has a prefix of C meaning that somehow our router is directly connected to that network (but how? line 3 knows) Again, we are just trying to traverse through the right places to get to our host. Getting to the right network that has the right subnet sounds like a good plan. 


## The definitive route. (line 3)
![Routing Table Pictures](/assets/img/CiscoRoutingTable/7.png)
The third line is the exact place on the current router the packet should go for that route. It's the definitive IP and port that is "Linked" (Prefix L) that allows us to get our IP packet friend into it's next hop. Basically it's saying "Listen if you're trying to get that packet to any subnet that belongs to 192.168.10.0 shoot it through the interface that has the IP of 192.168.10.1. It's called Gigabit Ethernet 0/0." Simple.   

>Example:
 For example, an IP packet - 192.168.11.131 can go be routed to 192.168.11.0 through the  current router's IP of 192.168.11.1. It will be on the network 192.168.11.0, but we can  assume that it consists of two subnets and the subnet of 192.168.11.128 will also be on that same router. There is no need to record that into the table, we've made it to the correct router, the router will do the rest.  


That's it. Done and Done you understand routing tables. 





Cheers, 
Zack Jones.



