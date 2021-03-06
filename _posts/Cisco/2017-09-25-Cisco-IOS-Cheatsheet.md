--- 
layout: post 
title: 
date: 2017-11-28 6:32:00 -0400 
categories: Cisco 
---
## Cisco IOS Cheatsheet


#### Moving from user EXEC mode to privildged EXEC mode and into configure mode.  

```                                      
|---------------------|-------------------------------------------|
|           Router>   |  enable                                   |
|                 #   |  configure terminal                       |
|         (config)#   |  hostname PutANameHere                    |
|---------------------|-------------------------------------------|
```
#### Moving to interface commands (to allow for writing configuration info for those interfaces) 

```                       
|---------------------|-------------------------------------------|
|         (config)#   |  interface serial 0/0/0                   |
|         (config)#   |  interface fastethernet 0/0               |
|         (config)#   |  interface ethernet 0/0                   |
|         (config)#   |  interface gigabitethernet 0/0            |
|---------------------|-------------------------------------------|
```
#### Setting interface commands (writing configuration information for interfaces  

```                                   
|---------------------|-------------------------------------------|
|      (config-if)#   |  ip address 192.168.1.1 255.255.255.0     |
|      (config-if)#   |  no shutdown                              |
|      (config-if)#   |  clock rate 56000                         |
|-----------------------------------------------------------------|
```
#### Default Routes/ Static Routes   
                                           
```
|---------------------|-------------------------------------------|
|         (config)#   | ip route 0.0.0.0 0.0.0.0 192.168.0.1      |     
|---------------------|-------------------------------------------|
```
#### Networking Protocol commands (for advertising networks to adjacent routers.)   
                                           
```
|---------------------|-------------------------------------------|
|         (config)#   |  router eigrp 1                           |
|  (config-router)#   |  network 192.168.1.0 255.255.255.0        |
|---------------------|-------------------------------------------|
```
#### Setting DHCP on router. (for distributing IP addresses to hosts in that network  

```
|---------------------|-------------------------------------------|
|         (config)#   |  ip dhcp pool PutANameHere                |
|    (config-dhcp)#   |  network 192.168.1.0 255.255.255.224      |
|    (config-dhcp)#   |  default-router 192.168.1.1               |
|    (config-dhcp)#   |  dns-server 192.168.1.80                  |
|---------------------|-------------------------------------------|
```
#### Moving to line config  

```
|---------------------|-------------------------------------------|
|         (config)#   | line console 0                            |
|         (config)#   | line vty 0 4                              |
|         (config)#   | line aux 0                                |
|---------------------|-------------------------------------------|

```
#### Nat Translation  

```
|----------------------------------|-----------------------------------------------|
| [On inside router](config-if)#   | ip nat in                                     |
| [On outside router](config-if)#  | ip nat out                                    |
|                       (config)#  | ip nat inside source list 1 in g0/0 overload  |
|----------------------------------|-----------------------------------------------|

```
#### Setting up line connection to allow connections with a password 

```

|-----------------------------------------------------------------|
|router(config-line)# | login                                     |
|router(config-line)# | password <passwordOnNextLine>             |
|router(config-line)# | exit                                      |
|-----------------------------------------------------------------|
```
#### Starting a service (like password encryption) 
       
```

|-----------------------------------------------------------------|
|         (config)#   | service password-encryption               |
|---------------------|-------------------------------------------|
```
#### Security and password setup   
  
                         

*For access to privileged EXEC mode* 

```        
|---------------------|-------------------------------------------|
|         (config)#   | enable password                           |
|---------------------|-------------------------------------------|

```
*For encrypted privileged EXEC password*

```
             
|---------------------|-------------------------------------------|
|         (config)#   | enable secret <passwordOnNextLine>        |
|---------------------|-------------------------------------------|
``` 



