---
layout: post
title:  "Cisco Command Notes"
date:   2017-09-04 23:00:39 -0400
categories: Cisco
---


## Cisco IOS levels and sub-levels

---

### EXEC Mode

#### Router> 
 
This is the opening mode. When you console into a Cisco router/switch or other intermediary device, this is where you will start.  


  
### Privileged EXEC Mode

#### Router# 
 
This mode allows you to access more configure options. It's the global settings. To get to this use <code> enable </code>, sometimes it will require a <code> enable password </code> or even a secret password (encrypted instead of plaintext) with <code> enable secret password </code>  



### Global Config Mode

#### Router(config)# 

This is where many of of the network configuration settings will be. To get here, use <code> configure terminal </code>  
*Note: Commands for Cisco IOS can be shortened. Use <code> config t</code> to do the same command*
 




### Sub-config Mode (interface)

#### Router(config-if)#


--- 

#DRAFT SECTION 09/05
<code>SHOW RUNNING CONFIG</code>
<code>SHOW STARTUP CONFIG</code>
<code>EXIT</code>
<code>ctrl + Z</code>
### to get into a cisco 
- console 
- puTTY
- CLI/terminal 

The CLI for Cisco is a keyword argument format. (sort of like noun verb with powershell) 

Argument - it's like an option. User defined or preset. 

The <code>?</code> can be used in two ways. With a space and without a space. With a space it shows all the options. Without it is shows command format. 

Tab after typing a few letters will finish command. 

up key will lookup previous commands. 

CTRL + A takes cursor back to the start. 

<Code> hostname </code>
The hostname cannot have spaces but can have hyphens and some special characters. Start with a letter. 

setting password 

<code>enable password cisco</code>
exit and then when you enable enter in the password
it will prevent users entering into privledge mode without a password. 

<code>use enable secret password password</code>

<code> line console 0 </code>
password cisco1
login


This adds a password to the console line itself. before you can even get to privlidge mode. Locks user mode. 

<code>line vty o 4 </code>
Sets up 5 total terminal connections to this device. 

password cisco2
login

from a computer with a terminal connection you can test this. 

<code> banner ? </code>
two modes. One is a message of the day.
<code> banner motd ? </code>
<code>banner motd c WARNING YOU ARE NOT WELCOME c </code>

see it in the show running config. or when you login to terminal 

<code> service password-encryption <code>
takes passwords and adds encryption

in show running you can press c to finish the scrolling. 

saving config. 
running config is saved in the RAM stack. 
<code>show startup-config</code>
<code>copy run start</code>


<code> WR </code>
does the same thing as copy run start

<code> copy start run </code>
copies the startup config to the running config just in case your running config is borked. 

you can save your config in a text file. 

ask about opening scripts instead of copy and pasting. 


--ports and addresses--
ip addresses dynamic or static. 
internet or intranet
IPv4 dotted decimal notation
octets
note the ranges of the IP classes
write about the different types of cables
media 
rollover cables - console cables
fiber optic 
coax 
cat 5
cat 6 
cat 5e


--- 

router eigrp ip sub

<code> dhcp pool cloud
network 200.100.50.16 255.255.255.240
</code>
<code> default-router 200.100.50.17 </code>

in the lab we subnetted down to 255.255.255.240
figured out the intervals. 
2^x is how you figure out how many bits you borrow. 

binary anding (make notes on it) 
https://www.hackthissite.org/articles/read/902










  







