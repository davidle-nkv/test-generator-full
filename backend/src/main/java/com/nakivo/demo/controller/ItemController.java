package com.nakivo.demo.controller;

import com.nakivo.demo.model.Item;
import com.nakivo.demo.repository.ItemRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemRepository repo;

    public ItemController(ItemRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Item> list() {
        return repo.findAll();
    }

    @PostMapping
    public ResponseEntity<Item> create(@RequestBody Item item) {
        Item saved = repo.save(item);
        return ResponseEntity.ok(saved);
    }
}
