--- 
layout: post 
title: 
date: 2017-09-26 11:30:00 -0400 
categories: Networking 
---
## Cisco IOS Cheatsheet


I'll expand on this as class goes on. Use this as needed. 

```
|---------------------|-------------------------------------------|
|             Prompt  |  Command                                  |
|---------------------|-------------------------------------------|
| Moving from user EXEC mode to privildged EXEC mode and          |
| to configure mode.                                              |
|---------------------|-------------------------------------------|
|           Router>   |  enable                                   |
|                 #   |  configure terminal                       |
|         (config)#   |  hostname PutANameHere                    |
|---------------------|-------------------------------------------|
| Moving to interface commands (to allow for writing              |
| configuration info for those interfaces)                        |
|---------------------|-------------------------------------------|
|         (config)#   |  interface serial 0/0/0                   |
|         (config)#   |  interface fastethernet 0/0               |
|         (config)#   |  interface ethernet 0/0                   |
|         (config)#   |  interface gigabitethernet 0/0            |
|---------------------|-------------------------------------------|
| Setting interface commands (writing configuration               |
| information for interfaces                                      |
|---------------------|-------------------------------------------|
|      (config-if)#   |  ip address 192.168.1.1 255.255.255.0     |
|      (config-if)#   |  no shutdown                              |
|      (config-if)#   |  clock rate 56000                         |
|-----------------------------------------------------------------|
| Networking Protocol commands (for advertising networks to       |
| adjacent routers.)                                              |
|---------------------|-------------------------------------------|
|         (config)#   |  router eigrp 1                           |
|  (config-router)#   |  network 192.168.1.0 255.255.255.0        |
|---------------------|-------------------------------------------|
| Setting DHCP on router. (for distributing IP addresses to       |
| hosts in that network                                           |
|---------------------|-------------------------------------------|
|         (config)#   |  ip dhcp pool PutANameHere                |
|    (config-dhcp)#   |  default-router 192.168.1.1               |
|    (config-dhcp)#   |  dns-server 291.168.1.80                  |
|---------------------|-------------------------------------------|
| Moving to line commands                                         |
|---------------------|-------------------------------------------|
|         (config)#   | line console 0                            |
|         (config)#   | line vty 0 4                              |
|         (config)#   | line aux 0                                |
|---------------------|-------------------------------------------|
| Setting up line connection for login and password               |
|-----------------------------------------------------------------|
|router(config-line)# | login                                     |
|router(config-line)# | password <passwordOnNextLine>             |
|router(config-line)# | exit                                      |
|-----------------------------------------------------------------|
| Starting a service (like password encryption)                   |
|-----------------------------------------------------------------|
|         (config)#   | service password-encryption               |
|---------------------|-------------------------------------------|
| Security and password setup                                     |
|---------------------|-------------------------------------------|
|     *For access to privileged EXEC mode*                        |
|---------------------|-------------------------------------------|
|         (config)#   | enable password                           |
|---------------------|-------------------------------------------|
|     *For encrypted privileged EXEC password*                    |
|---------------------|-------------------------------------------|
|         (config)#   | enable secret <passwordOnNextLine>        |
|---------------------|-------------------------------------------|
``` 



