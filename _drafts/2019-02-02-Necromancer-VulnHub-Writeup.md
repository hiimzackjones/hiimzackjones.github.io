
--- 
layout: post 
title: Necromancer VulnHub Writeup
date: 2019-02-02 09:16:00 -0400 
categories: InfoSec 
---


# Necromancer

### Made for Intro for Cyber Security Class taught Spring 2019.

## Necromancer Notes

Necromancer is a CTF that can be downloaded and ran on a virtual environment such as VirtualBox, VMWare, Hyper-V.  [https://www.vulnhub.com/entry/the-necromancer-1,154/](https://www.vulnhub.com/entry/the-necromancer-1,154/) 

1. Passive Recon - Looks at the website for clues, looks at the virtual machine's screen for information. Also gathers information about his machine and the network. Finds all IP addresses on the network in order to find the machine. Eliminates other machines one by one. 
    1. Uses route to find gateway, looks in log files to find DHCP, looks in ifconfig for himself. Last IP is the machine. 

### Commands to find things out about your own network

```bash
ifconfig                          //checking linux interface information. Similar to Windows ipconfig
route -n                          // checking what your machine's gateway. 
```

2. Active Recon -first nmap the network to get an idea of what machines are on the network and help find the machine you're looking to hack. Then nmap scan on the IP address of the victim machine. Looks for ports that could be vulnerable. 

### Scanning whole network for all machines that are up

```bash
nmap -sP 192.168.1.*
```

### Scanning a single machine for tcp ports that are open (simple)

```bash
nmap 192.168.1.140
```

Ports that are vulnerable are things like http, https, ssh, telnet, smb, and plenty others.

3. He fails to find a port that is open using a typical TCP nmap scan. He decided to run another scan, but tell nmap to check for UDP instead of TCP. With UDP you want to limit the ports. 

```bash
nmap -sU 1-1000 192.168.1.140              //does a udp scan on ports 1 through 1000
```

4. Scans find a port open. He finds a UDP port that is open called doom on port 666.

To connect to a computer you must have a socket. And to have a socket all you need is the IP address and an open port that is willing to communicate. 

5. attempts to connect to the port - 666 using a tool called netcat. 

```bash
nc -u 192.168.110.140 666
```

6. Successfully connects to the port and the necromancer machine then sends plaintext data to him that says "Time is running out. You gasp for air!"

[7.](http://7.TO) To see if anything else is happening on the machine while the UDP port is connected. He opens wireshark and lets it run for a bit to find that the Necromancer machine actually attempts to connect to his machine on TCP port 4444. Note: The TCP port seems to only want to connect once you've connected to the UDP port. 

```bash
nc -lvp 4444                    /// listens for any incoming connections on port 4444
```

8. It spits out a string of random characters. This was encoded and needed to be decoded. 

9. The decoded message left a clue that said "Chant the string of flag1 -u666" it also gives him the first flag which is jumbled letters and numbers. 

When you find jumbled letters and numbers, it may be good practice to test to see if it is encoded or encrypted and possibly useful information.

### To check a string for encoding or hashing/encryption

```bash
hashid [the string you are testing]       //hashID will tell you if it's encoded or hashed and what type of hash it might be
```

10. HashID shows that the string is an MD5 hash and he uses an online MD5 hash decrypt tool. The flag decrypted ends up being 'opensesame'

10. Connects to UDP port 666 while sending 'opensesame' to the other machine using echo. 

```bash
echo opensesame | nc -u 192.168.100.140 666
```

11. Once he makes this new connection it gives him another clue along with a second flag. This clue lets him know that 666 is closed and "A formation that looks like 80"

port 80 is generally used for HTTP. HTTPS, which is encrypted is usually on 443. If a computer has port 80 open, you can go to it's ip address on your machine to look at whatever webpage(s) it is hosting. 

12. He nmap scans the machine again to make sure port 80 is open. 

13. He goes to the website. 

14. The first thing he does to recon the site is to look at the source code to see if there are more clues or to see if it is wordpress, etc. 

15. He notices that the only thing on the page that may have something worth looking into is the picture so he checks the picture for stenography. 

stego isn't typically used in the real world, but is a good skill to understand and know how to work with as a Cyber Security professional. 

```bash
unzip pileoffeathers.jpg                 //attempt to unzip a file to find other files within it. Files can be hidden inside of other files. 
```

16. once he unzips the picture, a pileoffeathers.txt is then pulled from the image and saved onto his machine.

17. The text file has another Base64 hash inside of it. It decodes to give another flag and a clue to his next step "/amagicbridgeappearsatthechasm" and the flag decodes to a number. 

18. he visits the directory from the hidden file to find another page. 

19. He ends the video here.