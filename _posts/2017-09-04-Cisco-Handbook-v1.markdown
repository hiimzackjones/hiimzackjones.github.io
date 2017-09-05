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
  







