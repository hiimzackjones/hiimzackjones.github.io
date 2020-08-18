--- 
layout: post 
title: Necromancer VulnHub Class Exercise
date: 2019-02-02 09:16:00 -0400 
categories: InfoSec 
---


## Necromancer Notes
##### Made for Intro for Cyber Security Class taught Spring 2019.

Necromancer is a CTF that can be downloaded and ran on a virtual environment such as VirtualBox, VMWare, Hyper-V.  [https://www.vulnhub.com/entry/the-necromancer-1,154/](https://www.vulnhub.com/entry/the-necromancer-1,154/) 

To assist with our walk through of this CTF, we will be using this reference video - [JackkTutorials - Necromancer](https://www.youtube.com/watch?v=ULRZcsjkvSA)  

The video does not complete the CTF but we will follow through the steps to complete as much as he completes in the video. Try to follow along with his steps.  

Following the hacking methodology as discussed, you will want to start with some recon.   

### Passive Recon
Jackk looks at the website for clues, looks at the virtual machine's screen for information. Also gathers information about his machine and the network. Finds all IP addresses on the network in order to find the machine. Eliminates other machines one by one. 

**Website information**
![Website Recon](/assets/img/Walkthroughs/Necromancer/Website-Recon.png)  
**Machine DHCP**  
![Machine DHCP](/assets/img/Walkthroughs/Necromancer/Machine_DHCP_Screen.png)



**To eliminate the IP addresses**  
He uses route to find gateway, looks in log files to find DHCP, looks in ifconfig for himself. Last IP is the machine. 


#### Commands used

```
ifconfig  //checking Linux interface information. Similar to Windows ipconfig
route -n  //checking what your machine's gateway. 
```
**Using Route to find the gateway**  
![route](/assets/img/Walkthroughs/Necromancer/route.png)  
**Using ifconfig to find your own IP**  
![ifconfig](/assets/img/Walkthroughs/Necromancer/ifconfig.png)  


### Active Recon
First <code>nmap</code> the network to get an idea of what machines are on the network and help find the machine you're looking to hack. Then nmap scan on the IP address of the victim machine. Look for ports that could be vulnerable. 

#### Scanning whole network for all machines that are up

```
nmap -sP 192.168.1.*
```
Note the use of a wildcard in the IP to cover all possible addresses in the 192.168.1 network.  
The -sP scan means just pinging machines. Note: Some machines may not respond to ICMP packets depending on how the machine is setup.

#### Scanning a single machine for tcp ports that are open (simple)

```
nmap 192.168.1.22
```

Ports that are vulnerable are things like http, https, ftp, telnet, smb, and plenty others. Other ports are important as well. Getting an idea of what the machine is running is key to understanding what you are working with. 

He fails to find a port that is open using a typical TCP nmap scan. He decided to run another scan, but tells nmap to check for UDP instead of TCP. With UDP you want to limit the ports. 

#### UDP nmap Scan
```
nmap -sU 1-1000 192.168.1.22   //does a udp scan on ports 1 through 1000
```
#### UDP Port found. 
Scans find a port open. He finds a UDP port that is open called doom on port 666.

To connect to a computer you must have a socket. And to have a socket all you need is the IP address and an open port that is willing to communicate. 

With UDP sometimes you can just simply connect to it with a tool called netcat. From there you will see the raw data being transferred. If it's encrypted you will not be able to read it. To try and connect to this:

```
nc -u 192.168.110.22 666
```

It successfully connects to the port and the necromancer machine then sends plaintext data to him that says <code>Time is running out. You gasp for air!"</code>  

To see if anything else is happening on the machine while the UDP port is connected. You can open wireshark and let it run for a bit to find that the Necromancer machine actually attempts to connect to his machine on TCP port 4444. Note: The TCP port seems to only want to connect once you've connected to the UDP port.  

You can also listen for connections the same way we did before for TCP connections. But in this case it's listening for any machine on the port. The command looks like this. 

```
nc -lvp 4444  /// listens for any incoming connections on port 4444
```

It connects successfully and it spits out a string of random characters. This was encoded and needed to be decoded.   

The decoded message left a clue that said <code>Chant the string of flag1 -u666</code> it also gives him the first flag which is jumbled letters and numbers.   

When you find jumbled letters and numbers, it may be good practice to test to see if it is encoded or encrypted and possibly useful information.  

### To check a string for encoding or hashing/encryption

```
hashid [the string you are testing]
```
Hashid is a tool that checks for signatures or clues of certain hashes. it isn't always accurate but it can help when you're not sure. 

HashID shows that the string is an MD5 hash and he uses an online MD5 hash decrypt tool. The flag decrypted ends up being <code>opensesame</code>  

Now he connects to UDP port 666 while sending <code>opensesame</code> to the other machine using echo. 

```
echo opensesame | nc -u 192.168.100.140 666
```
By using echo and piping it into the netcat connection, we send it the string <code>opensesame</code>  

Once he makes this new connection it gives him another clue along with a second flag. This clue lets him know that 666 is closed and "A formation that looks like 80"  

Port 80 is generally used for HTTP. HTTPS, which is encrypted is usually on 443. If a computer has port 80 open, you can go to it's ip address on your machine to look at whatever webpage(s) it is hosting.  

He nmap scans the machine again to make sure port 80 is open.   

He goes to the website.   

The first thing he does to recon the site is to look at the source code to see if there are more clues or to see if it is wordpress, etc.   

He notices that the only thing on the page that may have something worth looking into is the picture so he checks the picture for stenography.   

Stego isn't typically used in the real world, but is a good skill to understand and know how to work with as a Cyber Security professional.  

```
unzip pileoffeathers.jpg   //attempt to unzip a file to find other files within it. Files can be hidden inside of other files. 
```

Once he unzips the picture, a pileoffeathers.txt is then pulled from the image and saved onto his machine.  

The text file has another Base64 hash inside of it. It decodes to give another flag and a clue to his next step "/amagicbridgeappearsatthechasm" and the flag decodes to a number.   

He visits the directory from the hidden file to find another page.  

#### Video ends here. 

We can assume that the <code>/amagicbridgeappearsatthechasm</code> is possibly a directory. Try going to the site by typing the host's IP address and then going to the url. From there use your Web pentesting notes to search through possible directories, check pages that are hidden from Google's web crawlers, test to see if it's running off of Wordpress, etc. Take screenshots of your findings. 

