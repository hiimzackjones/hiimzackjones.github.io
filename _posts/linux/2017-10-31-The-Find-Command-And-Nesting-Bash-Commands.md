--- 
layout: post 
title: 
date: 2017-10-31 23:34:00 -0400 
categories: Linux 
---

I learned this trick the other day working on a Capture the flag challenge. If you don't know what a Capture the flag is, do a quick google. It's pretty cool. 

Basically there was a file named 'flag' hidden deep within some directories and each directory had multiple files. If I wanted to find the file using basic commands I could have simply just used cd and ls and manually looked through each directory. But that could take forever. So I looked around and find a Linux command that would look within the directory tree for any files with the keyword I told it to look for. It was such a useful command that I decided to write a quick post on it. 

---
I started by making the directories and fake files as well as the flag file. I put all of this in a directory called tree. Coincidentally I use a command called tree to go ahead and show how the files are layed out before we test out the find command.  
![1](/assets/img/Find/1.gif)  

I made the 'branches' pretty deep. If the output of tree was confusing, here is what it looks like.   
![2](/assets/img/Find/2.png)  

So the find command is really easy. Use <code>man find</code> to read about it. in this case I used <code>find [directory to start from] -name [keyword to look for in name]</code>  

I knew that it was at least in Documents/tree and it had the name 'flag' in it.   

Notice that it does the same sort of printing out that a command like pwd does.   
![3](/assets/img/Find/3.gif)  
Okay so we found it. But we need to cat out the contents. So we could use cat and copy and paste. Or cd into it by copying and pasting. I did that here.   
![4](/assets/img/Find/4.gif)  
So doing this challenge in a few lines is cool and all but sometimes it feels inefficient to have to leave the keyboard to copy and paste.    
This is one of those moments where you can really take advantage of the shell.  
![5](/assets/img/Find/5.gif)  
  
Here I did the two commands I did in the first example but I sort of nested a command within another. In the <code> cat flag </code> command, I replace flag with the first line. But I use a special syntax to tell <code>cat</code> to do things in a certain order. Notice <code> $() </code>   
It's basically like this-   

<code>command2 $(Command1)</code>    
Where Command1 is the first command the shell executes, then the output of that command is used as the argument for Command2. That's a basic way to explain it.  

Well. That's all I have. Use find to find stuff and use $() to 'nest' a command in the place of another command's argument. 




  





Cheers, 
Zack Jones.



