using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PrimusFeesten.Models
{
    public class Order
    {
        public Guid Id { get; set; }
        public int TableId { get; set; }
        public List<OrderItem> Items { get; set; }
    }

    public class OrderItem
    {
        public int Quantity { get; set; }
        public string Name { get; set; }
    }
}