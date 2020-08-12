# @file sampledsc.dsc

[Defines]

[Components.x64]
  HelloWorldDriver/HelloWorld.inf

[PcdsFixedAtBuild.common]
  sampledec.NumberOfUniverses | 0x00000013

[BuildOptions]