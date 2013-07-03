using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using PrimusFeesten.Models;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PrimusFeesten.Hubs
{
    public class OrderManager
    {

        private readonly ConcurrentBag<Order> _orders = new ConcurrentBag<Order>(){
            new Order{TableId=1,Items=new List<OrderItem>{new OrderItem{Name="Bier",Quantity=3}}}
        };

        // Singleton instance
        private readonly static Lazy<OrderManager> _instance = new Lazy<OrderManager>(
            () => new OrderManager(GlobalHost.ConnectionManager.GetHubContext<OrderHub>().Clients));

        IHubConnectionContext _clients;

        private OrderManager(IHubConnectionContext clients)
        {
            _clients = clients;
        }

        public static OrderManager Instance
        {
            get
            {
                return _instance.Value;
            }
        }

        public List<Order> GetNotPaidOrders()
        {
            return _orders.ToList();
        }

        public int AddOrder(Order order)
        {
            _orders.Add(order);
            _clients.All.incomingOrder(order);
            return _orders.Count;
        }

    }

    [HubName("orderManager")]
    public class OrderHub:Hub
    {
         private readonly OrderManager _orderManager;

         public OrderHub() : this(OrderManager.Instance) { }

         public OrderHub(OrderManager orderManager)
        {
            _orderManager = orderManager;
        }


        public List<Order> GetNotPaidOrders()
        {
            return _orderManager.GetNotPaidOrders();
        }

        public int AddOrder(Order order)
        {
            return _orderManager.AddOrder(order);
        }
    }
}