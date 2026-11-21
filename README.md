# Sokoban Solver — Push-Optimal, Room by Room

[![make.fun](https://make.fun/badge/sokoban-solver-01-run-20261121.svg)](https://make.fun/bounty/sokoban-solver-01-run-20261121)
[![rank](https://make.fun/badge/sokoban-solver-01-run-20261121/tyler-2-makefun/sokoban-solver-01-run-20261121/rank.svg)](https://make.fun/bounty/sokoban-solver-01-run-20261121)
[![reward](https://make.fun/badge/sokoban-solver-01-run-20261121/tyler-2-makefun/sokoban-solver-01-run-20261121/reward.svg)](https://make.fun/bounty/sokoban-solver-01-run-20261121)

[View the bounty on make.fun](https://make.fun/bounty/sokoban-solver-01-run-20261121)

Push-optimal Sokoban solver. A level is a hallway with rooms off it, and a box pushed out of a room can never return, so each room is solved on its own with breadth-first search over pushes (a state is the boxes plus the player's reachable region; dead squares and frozen 2x2 blocks are pruned) and the rooms' optima add up to the level optimum. No clock, no randomness — two runs agree byte for byte.
